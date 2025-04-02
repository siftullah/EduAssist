export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    // Find all assignments of the faculty with improved query
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
      include: {
        user: {
          include: {
            classroom_teachers: {
              include: {
                classroom: {
                  include: {
                    course: true, // Include course details
                    threads: {
                      where: {
                        type: "assignment",
                      },
                      include: {
                        assignments: {
                          include: {
                            submissions: true,
                          },
                        },
                        main_post: true, // Include main post for description
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Format the response with more details
    const classes = faculty.user.classroom_teachers.map((ct) => ({
      id: ct.classroom.id,
      name: ct.classroom.name,
      course: {
        id: ct.classroom.course.id,
        name: ct.classroom.course.course_name,
        code: ct.classroom.course.course_code,
      },
    }));

    // Enhanced assignment details
    const assignments = faculty.user.classroom_teachers.flatMap((ct) =>
      ct.classroom.threads
        .filter((thread) => thread.assignments && thread.assignments.length > 0)
        .map((thread) => ({
          id: thread.assignments[0].id,
          thread_id: thread.id,
          title: thread.title,
          description: thread.main_post?.description || "",
          dueDate: thread.assignments[0].due_date,
          totalMarks: thread.assignments[0].total_marks,
          submissionCount: thread.assignments[0].submissions.length,
          classroom: {
            id: ct.classroom.id,
            name: ct.classroom.name,
            course: {
              id: ct.classroom.course.id,
              name: ct.classroom.course.course_name,
              code: ct.classroom.course.course_code,
            },
          },
        }))
    );

    return NextResponse.json({
      classes,
      assignments,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Unauthorized: Faculty access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      dueDate,
      totalMarks,
      classroomId,
      attachments,
    } = body;

    // Validate required fields
    if (!title || !description || !dueDate || !totalMarks || !classroomId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create assignment and related records in a transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Create thread first
        const thread = await tx.classroomThread.create({
          data: {
            title,
            type: "assignment",
            classroom_id: classroomId,
          },
        });

        // Create main post for the thread
        const mainPost = await tx.classroomPost.create({
          data: {
            thread_id: thread.id,
            description,
            type: "main",
            user_id: user.id,
            attachments: {
              create: attachments || [],
            },
          },
        });

        // Update thread with main post
        await tx.classroomThread.update({
          where: { id: thread.id },
          data: { main_post_id: mainPost.id },
        });

        // Create assignment
        const assignment = await tx.assignment.create({
          data: {
            thread_id: thread.id,
            classroom_id: classroomId,
            due_date: new Date(dueDate),
            total_marks: parseFloat(totalMarks),
          },
          include: {
            classroom: {
              include: {
                course: true,
              },
            },
            thread: {
              include: {
                main_post: {
                  include: {
                    attachments: true,
                  },
                },
              },
            },
          },
        });

        return assignment;
      },
      {
        timeout: 20000, // Increased timeout to long time
        maxWait: 20000, // Maximum time to wait for transaction to start
      }
    );

    // Format the response
    const formattedResponse = {
      id: result.id,
      thread_id: result.thread_id,
      title: result.thread.title,
      description: result.thread.main_post?.description || "",
      dueDate: result.due_date,
      totalMarks: result.total_marks,
      classroom: {
        id: result.classroom.id,
        name: result.classroom.name,
        course: {
          id: result.classroom.course.id,
          name: result.classroom.course.course_name,
          code: result.classroom.course.course_code,
        },
      },
      attachments:
        result.thread.main_post?.attachments.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          filepath: attachment.filepath,
        })) || [],
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
