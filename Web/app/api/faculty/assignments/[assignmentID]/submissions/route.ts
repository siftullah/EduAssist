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
            main_post: true,
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
      assignment: {
        id: assignment.id,
        title: assignment.thread.title,
        totalMarks: assignment.total_marks,
        dueDate: assignment.due_date,
        classroom: {
          id: assignment.classroom.id,
          name: assignment.classroom.name,
          course: {
            id: assignment.classroom.course.id,
            name: assignment.classroom.course.course_name,
            code: assignment.classroom.course.course_code,
          },
        },
      },
      submissions: assignment.submissions.map((submission) => ({
        id: submission.id,
        student: {
          id: submission.student.id,
          name: `${submission.student.user.first_name} ${submission.student.user.last_name}`,
          rollNumber: submission.student.roll_number,
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
      totalEnrolled: assignment.classroom.enrollments.length,
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
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
    const { submissionId, marks } = body;

    if (!submissionId || marks === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: { marks: parseFloat(marks) },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        attachments: true,
      },
    });

    return NextResponse.json({
      id: submission.id,
      student: {
        id: submission.student.id,
        name: `${submission.student.user.first_name} ${submission.student.user.last_name}`,
        email: submission.student.user.email_address,
      },
      submittedOn: submission.submitted_on,
      marks: submission.marks,
      attachments: submission.attachments,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
