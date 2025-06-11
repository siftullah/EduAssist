export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentID: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    // Check if the user is a faculty member
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Unauthorized: Faculty access required" },
        { status: 403 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentID },
      include: {
        classroom: {
          include: {
            course: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        thread: {
          include: {
            main_post: {
              include: {
                created_by: true,
                attachments: true,
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            attachments: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedResponse = {
      id: assignment.id,
      thread_id: assignment.thread_id,
      title: assignment.thread.title,
      description: assignment.thread.main_post?.description || "",
      created_by: assignment.thread.main_post
        ? `${assignment.thread.main_post.created_by.first_name} ${assignment.thread.main_post.created_by.last_name}`
        : "",
      attachments:
        assignment.thread.main_post?.attachments.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          filepath: attachment.filepath,
        })) || [],
      dueDate: assignment.due_date,
      totalMarks: assignment.total_marks,
      classroom: {
        id: assignment.classroom.id,
        name: assignment.classroom.name,
        course: {
          id: assignment.classroom.course.id,
          name: assignment.classroom.course.course_name,
          code: assignment.classroom.course.course_code,
        },
      },
      submissions: {
        total: assignment.submissions.length,
        enrolled: assignment.classroom.enrollments.length,
        items: assignment.submissions.map((submission) => ({
          id: submission.id,
          student: {
            id: submission.student.id,
            name: `${submission.student.user.first_name} ${submission.student.user.last_name}`,
            email: submission.student.user.email_address,
          },
          submittedOn: submission.submitted_on,
          marks: submission.marks,
          attachments: submission.attachments.map((attachment) => ({
            id: attachment.id,
            filename: attachment.filename,
            filepath: attachment.filepath,
          })),
        })),
      },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentID: string } }
) {
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
    const { title, description, dueDate, totalMarks, classroomId } = body;

    if (!title || !description || !dueDate || !totalMarks || !classroomId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First, check if the assignment exists
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentID },
      include: {
        thread: {
          include: {
            main_post: true,
          },
        },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Perform updates in parallel using Promise.all
    const [updatedThread, updatedMainPost, updatedAssignment] =
      await Promise.all([
        // Update thread
        prisma.classroomThread.update({
          where: { id: existingAssignment.thread_id },
          data: { title },
        }),

        // Update main post if it exists
        existingAssignment.thread.main_post_id
          ? prisma.classroomPost.update({
              where: { id: existingAssignment.thread.main_post_id },
              data: { description },
            })
          : Promise.resolve(null),

        // Update assignment
        prisma.assignment.update({
          where: { id: params.assignmentID },
          data: {
            due_date: new Date(dueDate),
            total_marks: parseFloat(totalMarks),
            classroom_id: classroomId,
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
        }),
      ]);

    // Format the response
    const formattedResponse = {
      id: updatedAssignment.id,
      thread_id: updatedAssignment.thread_id,
      title: updatedThread.title,
      description: updatedMainPost?.description || "",
      dueDate: updatedAssignment.due_date,
      totalMarks: updatedAssignment.total_marks,
      classroom: {
        id: updatedAssignment.classroom.id,
        name: updatedAssignment.classroom.name,
        course: {
          id: updatedAssignment.classroom.course.id,
          name: updatedAssignment.classroom.course.course_name,
          code: updatedAssignment.classroom.course.course_code,
        },
      },
      attachments:
        updatedAssignment.thread.main_post?.attachments.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          filepath: attachment.filepath,
        })) || [],
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
