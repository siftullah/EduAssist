export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { classID: string } }
) {
  const prisma = new PrismaClient();

  try {
    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 404 }
      );
    }

    const classId = params.classID;

    // Get classroom details with related data
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classId,
        enrollments: {
          some: {
            student: {
              user_id: user.id,
            },
          },
        },
      },
      include: {
        course: true,
        teachers: {
          include: {
            user: true,
          },
        },
        enrollments: {
          include: {
            student: true,
          },
        },
        threads: {
          include: {
            posts: {
              include: {
                created_by: true,
              },
            },
            assignments: {
              include: {
                submissions: {
                  where: {
                    student: {
                      user_id: user.id,
                    },
                  },
                  select: {
                    marks: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found or access denied" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedResponse = {
      id: classroom.id,
      name: classroom.name,
      courseInfo: {
        code: classroom.course.course_code,
        name: classroom.course.course_name,
      },
      teachers: {
        faculty: classroom.teachers
          .filter((t) => t.type === "faculty")
          .map((t) => ({
            id: t.user.id,
            name: `${t.user.first_name} ${t.user.last_name}`,
          })),
        ta: classroom.teachers
          .filter((t) => t.type === "TA")
          .map((t) => ({
            id: t.user.id,
            name: `${t.user.first_name} ${t.user.last_name}`,
          })),
      },
      studentCount: classroom.enrollments.length,
      threads: {
        announcements: classroom.threads
          .filter((t) => t.type === "announcement")
          .map((thread) => {
            const mainPost = thread.posts.find((p) => p.type === "main");
            return {
              id: thread.id,
              title: thread.title,
              main_post: {
                id: mainPost?.id,
                description: mainPost?.description,
                createdAt: mainPost?.createdAt,
                author: `${mainPost?.created_by.first_name} ${mainPost?.created_by.last_name}`,
              },
            };
          }),
        assignments: classroom.threads
          .filter((t) => t.type === "assignment")
          .map((thread) => {
            const mainPost = thread.posts.find((p) => p.type === "main");
            return {
              id: thread.id,
              title: thread.title,
              assignment: {
                id: thread.assignments[0]?.id,
                dueDate: thread.assignments[0]?.due_date,
                totalMarks: thread.assignments[0]?.total_marks,
                marks: thread.assignments[0]?.submissions[0]?.marks,
              },
              main_post: {
                id: mainPost?.id,
                description: mainPost?.description,
                createdAt: mainPost?.createdAt,
                author: `${mainPost?.created_by.first_name} ${mainPost?.created_by.last_name}`,
              },
            };
          }),
        discussions: classroom.threads
          .filter((t) => t.type === "discussion")
          .map((thread) => {
            const mainPost = thread.posts.find((p) => p.type === "main");
            return {
              id: thread.id,
              title: thread.title,
              main_post: {
                id: mainPost?.id,
                description: mainPost?.description,
                createdAt: mainPost?.createdAt,
                author: `${mainPost?.created_by.first_name} ${mainPost?.created_by.last_name}`,
              },
              reply_count: thread.posts.length - 1,
            };
          }),
      },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching classroom details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
