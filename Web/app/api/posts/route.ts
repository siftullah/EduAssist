import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Get users with specific IDs
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: ['user_2rDujCi7vz6cmoCus27URk3HRLE', 'user_2rDiMkoawYFUG8v331LR2xTuGFb']
        }
      }
    });

    let allResults = [];

    for (const user of users) {
      // 1. Get custom groups posts
      const customGroupPosts = await getCustomGroupPosts(user.id);
      allResults = [...allResults, ...customGroupPosts];

      // 3-5. Get department related posts
      const departmentPosts = await getDepartmentPosts(user);
      allResults = [...allResults, ...departmentPosts];

      // 6-7. Get batch related posts (for students)
      if (user.role === 'student') {
        const batchPosts = await getBatchPosts(user.id);
        allResults = [...allResults, ...batchPosts];
      }

      // 8-9. Get university-wide forum posts
      const universityPosts = await getUniversityPosts(user);
      allResults = [...allResults, ...universityPosts];

      // 10-11. Get direct custom group threads
      const directCustomGroupPosts = await getDirectCustomGroupPosts(user.id);
      allResults = [...allResults, ...directCustomGroupPosts];

      // 12-13. Get department and batch group direct threads
      const departmentBatchDirectPosts = await getDepartmentBatchDirectPosts(user);
      allResults = [...allResults, ...departmentBatchDirectPosts];

      // 14-15. Get university-wide direct threads
      const universityDirectPosts = await getUniversityDirectPosts(user);
      allResults = [...allResults, ...universityDirectPosts];

      // 16-17. Get classroom posts for students
      if (user.role === 'student') {
        const classroomPosts = await getStudentClassroomPosts(user.id);
        allResults = [...allResults, ...classroomPosts];
      }

      // 18-19. Get classroom posts for teachers
      const teacherClassroomPosts = await getTeacherClassroomPosts(user.id);
      allResults = [...allResults, ...teacherClassroomPosts];
    }

    // Create Excel workbook with column order
    const wb = XLSX.utils.book_new();
    
    // Define column order
    const columnOrder = [
      "source",
      "user_id",
      "post_id",
      "classroom_id",
      "forum_id",
      "thread_id",
      "description",
      "created_at",
      "user_role_type",
      "post_creator_role"
    ];

    // Create worksheet with specific column order
    const ws = XLSX.utils.json_to_sheet(allResults, {
      header: columnOrder
    });

    // Auto-size columns
    const colWidths = {};
    allResults.forEach(row => {
      columnOrder.forEach(col => {
        const value = String(row[col] || '');
        colWidths[col] = Math.max(colWidths[col] || 10, value.length);
      });
    });

    ws['!cols'] = columnOrder.map(col => ({ wch: colWidths[col] }));

    XLSX.utils.book_append_sheet(wb, ws, "Posts Data");

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="posts_data.xlsx"'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function getCustomGroupPosts(userId: string) {
  const customGroupPosts = await prisma.customGroupMembers.findMany({
    where: { user_id: userId },
    select: {
      custom_group: {
        select: {
          group: {
            select: {
              forums: {
                select: {
                  id: true,
                  threads: {
                    select: {
                      id: true,
                      posts: {
                        select: {
                          id: true,
                          description: true,
                          user_id: true,
                          createdAt: true,
                          created_by: {
                            select: {
                              role: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return customGroupPosts.flatMap(member => 
    member.custom_group.group.forums.flatMap(forum =>
      forum.threads.flatMap(thread =>
        thread.posts.map(post => ({
          user_id: userId,
          post_id: post.id,
          classroom_id: null,
          forum_id: forum.id,
          thread_id: thread.id,
          description: post.description,
          created_at: Math.floor(post.createdAt.getTime() / 1000),
          source: "1. Custom Group Forum Posts",
          post_creator_role: post.created_by?.role || "unknown"
        }))
      )
    )
  );
}

async function getDepartmentPosts(user: any) {
  let departmentId = null;

  if (user.role === 'student') {
    const student = await prisma.student.findFirst({
      where: { user_id: user.id },
      select: {
        department_batch: {
          select: {
            department: { select: { id: true } }
          }
        }
      }
    });
    departmentId = student?.department_batch.department.id;
  } else if (user.role === 'faculty') {
    const faculty = await prisma.faculty.findFirst({
      where: { user_id: user.id },
      select: { dept_id: true }
    });
    departmentId = faculty?.dept_id;
  }

  if (!departmentId) return [];

  const departmentPosts = await prisma.departmentGroup.findMany({
    where: { department_id: departmentId },
    select: {
      group: {
        select: {
          forums: {
            select: {
              id: true,
              threads: {
                select: {
                  id: true,
                  posts: {
                    select: {
                      id: true,
                      description: true,
                      user_id: true,
                      createdAt: true,
                      created_by: {
                        select: {
                          role: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return departmentPosts.flatMap(deptGroup =>
    deptGroup.group.forums.flatMap(forum =>
      forum.threads.flatMap(thread =>
        thread.posts.map(post => ({
          user_id: user.id,
          post_id: post.id,
          classroom_id: null,
          forum_id: forum.id,
          thread_id: thread.id,
          description: post.description,
          created_at: Math.floor(post.createdAt.getTime() / 1000),
          source: "3-5. Department Forum Posts",
          post_creator_role: post.created_by?.role || "unknown"
        }))
      )
    )
  );
}

async function getBatchPosts(userId: string) {
  const student = await prisma.student.findFirst({
    where: { user_id: userId },
    select: {
      department_batch: {
        select: {
          batch: { select: { id: true } }
        }
      }
    }
  });

  if (!student) return [];

  const batchId = student.department_batch.batch.id;

  const batchPosts = await prisma.batchGroup.findMany({
    where: { batch_id: batchId },
    select: {
      group: {
        select: {
          forums: {
            select: {
              id: true,
              threads: {
                select: {
                  id: true,
                  posts: {
                    select: {
                      id: true,
                      description: true,
                      user_id: true,
                      createdAt: true,
                      created_by: {
                        select: {
                          role: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return batchPosts.flatMap(batchGroup =>
    batchGroup.group.forums.flatMap(forum =>
      forum.threads.flatMap(thread =>
        thread.posts.map(post => ({
          user_id: userId,
          post_id: post.id,
          classroom_id: null,
          forum_id: forum.id,
          thread_id: thread.id,
          description: post.description,
          created_at: Math.floor(post.createdAt.getTime() / 1000),
          source: "6-7. Batch Forum Posts",
          post_creator_role: post.created_by?.role || "unknown"
        }))
      )
    )
  );
}

async function getUniversityPosts(user: any) {
  const universityPosts = await prisma.forum.findMany({
    where: {
      university_id: user.university_id,
      group_id: null
    },
    select: {
      id: true,
      threads: {
        select: {
          id: true,
          posts: {
            select: {
              id: true,
              description: true,
              user_id: true,
              createdAt: true,
              created_by: {
                select: {
                  role: true
                }
              }
            }
          }
        }
      }
    }
  });

  return universityPosts.flatMap(forum =>
    forum.threads.flatMap(thread =>
      thread.posts.map(post => ({
        user_id: user.id,
        post_id: post.id,
        classroom_id: null,
        forum_id: forum.id,
        thread_id: thread.id,
        description: post.description,
        created_at: Math.floor(post.createdAt.getTime() / 1000),
        source: "8-9. University Forum Posts",
        post_creator_role: post.created_by?.role || "unknown"
      }))
    )
  );
}

async function getDirectCustomGroupPosts(userId: string) {
  const customGroupThreads = await prisma.customGroupMembers.findMany({
    where: { user_id: userId },
    select: {
      custom_group: {
        select: {
          group: {
            select: {
              threads: {
                where: { forum_id: null },
                select: {
                  id: true,
                  posts: {
                    select: {
                      id: true,
                      description: true,
                      user_id: true,
                      createdAt: true,
                      created_by: {
                        select: {
                          role: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return customGroupThreads.flatMap(member =>
    member.custom_group.group.threads.flatMap(thread =>
      thread.posts.map(post => ({
        user_id: userId,
        post_id: post.id,
        classroom_id: null,
        forum_id: null,
        thread_id: thread.id,
        description: post.description,
        created_at: Math.floor(post.createdAt.getTime() / 1000),
        source: "10-11. Direct Custom Group Posts",
        post_creator_role: post.created_by?.role || "unknown"
      }))
    )
  );
}

async function getDepartmentBatchDirectPosts(user: any) {
  let groupIds = [];

  if (user.role === 'student') {
    const student = await prisma.student.findFirst({
      where: { user_id: user.id },
      select: {
        department_batch: {
          select: {
            department: {
              select: {
                id: true,
                groups: {
                  select: { group_id: true }
                }
              }
            },
            batch: {
              select: {
                groups: {
                  select: { group_id: true }
                }
              }
            }
          }
        }
      }
    });

    if (student) {
      groupIds = [
        ...student.department_batch.department.groups.map(g => g.group_id),
        ...student.department_batch.batch.groups.map(g => g.group_id)
      ];
    }
  } else if (user.role === 'faculty') {
    const faculty = await prisma.faculty.findFirst({
      where: { user_id: user.id },
      select: {
        department: {
          select: {
            groups: {
              select: { group_id: true }
            }
          }
        }
      }
    });

    if (faculty) {
      groupIds = faculty.department.groups.map(g => g.group_id);
    }
  }

  const directPosts = await prisma.thread.findMany({
    where: {
      forum_id: null,
      group_id: { in: groupIds }
    },
    select: {
      id: true,
      posts: {
        select: {
          id: true,
          description: true,
          user_id: true,
          createdAt: true,
          created_by: {
            select: {
              role: true
            }
          }
        }
      }
    }
  });

  return directPosts.flatMap(thread =>
    thread.posts.map(post => ({
      user_id: user.id,
      post_id: post.id,
      classroom_id: null,
      forum_id: null,
      thread_id: thread.id,
      description: post.description,
      created_at: Math.floor(post.createdAt.getTime() / 1000),
      source: "12-13. Department/Batch Direct Posts",
      post_creator_role: post.created_by?.role || "unknown"
    }))
  );
}

async function getUniversityDirectPosts(user: any) {
  const directPosts = await prisma.thread.findMany({
    where: {
      university_id: user.university_id,
      forum_id: null,
      group_id: null
    },
    select: {
      id: true,
      posts: {
        select: {
          id: true,
          description: true,
          user_id: true,
          createdAt: true,
          created_by: {
            select: {
              role: true
            }
          }
        }
      }
    }
  });

  return directPosts.flatMap(thread =>
    thread.posts.map(post => ({
      user_id: user.id,
      post_id: post.id,
      classroom_id: null,
      forum_id: null,
      thread_id: thread.id,
      description: post.description,
      created_at: Math.floor(post.createdAt.getTime() / 1000),
      source: "14-15. University Direct Posts",
      post_creator_role: post.created_by?.role || "unknown"
    }))
  );
}

async function getStudentClassroomPosts(userId: string) {
  const student = await prisma.student.findFirst({
    where: { user_id: userId },
    select: {
      enrollments: {
        select: {
          classroom: {
            select: {
              id: true,
              threads: {
                select: {
                  id: true,
                  posts: {
                    select: {
                      id: true,
                      description: true,
                      user_id: true,
                      createdAt: true,
                      created_by: {
                        select: {
                          role: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return student?.enrollments.flatMap(enrollment =>
    enrollment.classroom.threads.flatMap(thread =>
      thread.posts.map(post => ({
        user_id: userId,
        post_id: post.id,
        classroom_id: enrollment.classroom.id,
        forum_id: null,
        thread_id: thread.id,
        description: post.description,
        created_at: Math.floor(post.createdAt.getTime() / 1000),
        source: "16-17. Student Classroom Posts",
        post_creator_role: post.created_by?.role || "unknown"
      }))
    )
  ) || [];
}

async function getTeacherClassroomPosts(userId: string) {
  const teacherClassrooms = await prisma.classroomTeachers.findMany({
    where: { user_id: userId },
    select: {
      type: true,
      classroom: {
        select: {
          id: true,
          threads: {
            select: {
              id: true,
              posts: {
                select: {
                  id: true,
                  description: true,
                  user_id: true,
                  createdAt: true,
                  created_by: {
                    select: {
                      role: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return teacherClassrooms.flatMap(teacher =>
    teacher.classroom.threads.flatMap(thread =>
      thread.posts.map(post => ({
        user_id: userId,
        post_id: post.id,
        classroom_id: teacher.classroom.id,
        forum_id: null,
        thread_id: thread.id,
        description: post.description,
        user_role_type: teacher.type,
        created_at: Math.floor(post.createdAt.getTime() / 1000),
        source: "18-19. Teacher Classroom Posts",
        post_creator_role: post.created_by?.role || "unknown"
      }))
    )
  );
} 