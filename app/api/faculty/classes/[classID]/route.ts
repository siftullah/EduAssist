export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { classID: string } }
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

    const classroom = await prisma.classroom.findFirst({
      where: {
        id: params.classID,
        teachers: {
          some: {
            user_id: user.id,
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
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        threads: {
          include: {
            main_post: {
              include: {
                created_by: true,
                attachments: true,
              },
            },
            assignments: {
              include: {
                submissions: true,
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
      course: {
        id: classroom.course.id,
        code: classroom.course.course_code,
        name: classroom.course.course_name,
      },
      teachers: {
        faculty: classroom.teachers
          .filter((t) => t.type === "faculty")
          .map((t) => ({
            id: t.user.id,
            name: `${t.user.first_name} ${t.user.last_name}`,
            email: t.user.email_address,
          })),
        ta: classroom.teachers
          .filter((t) => t.type === "TA")
          .map((t) => ({
            id: t.user.id,
            name: `${t.user.first_name} ${t.user.last_name}`,
            email: t.user.email_address,
          })),
      },
      students: classroom.enrollments.map((e) => ({
        id: e.student.id,
        name: `${e.student.user.first_name} ${e.student.user.last_name}`,
        email: e.student.user.email_address,
        rollNumber: e.student.roll_number,
      })),
      threads: {
        announcements: classroom.threads
          .filter((t) => t.type === "announcement")
          .map((thread) => ({
            id: thread.id,
            title: thread.title,
            description: thread.main_post?.description || "",
            createdAt: thread.main_post?.createdAt,
            author: thread.main_post?.created_by
              ? `${thread.main_post.created_by.first_name} ${thread.main_post.created_by.last_name}`
              : "Unknown",
            attachments: thread.main_post?.attachments || [],
          })),
        discussions: classroom.threads
          .filter((t) => t.type === "discussion")
          .map((thread) => ({
            id: thread.id,
            title: thread.title,
            description: thread.main_post?.description || "",
            createdAt: thread.main_post?.createdAt,
            author: thread.main_post?.created_by
              ? `${thread.main_post.created_by.first_name} ${thread.main_post.created_by.last_name}`
              : "Unknown",
            attachments: thread.main_post?.attachments || [],
          })),
        assignments: classroom.threads
          .filter((t) => t.type === "assignment")
          .map((thread) => ({
            id: thread.id,
            title: thread.title,
            description: thread.main_post?.description || "",
            createdAt: thread.main_post?.createdAt,
            author: thread.main_post?.created_by
              ? `${thread.main_post.created_by.first_name} ${thread.main_post.created_by.last_name}`
              : "Unknown",
            assignment: thread.assignments[0]
              ? {
                  id: thread.assignments[0].id,
                  dueDate: thread.assignments[0].due_date,
                  totalMarks: thread.assignments[0].total_marks,
                  submissionCount: thread.assignments[0].submissions.length,
                  pendingGrading: thread.assignments[0].submissions.filter(
                    (s) => s.marks === null
                  ).length,
                }
              : null,
            attachments: thread.main_post?.attachments || [],
          })),
      },
      stats: {
        studentCount: classroom.enrollments.length,
        assignmentCount: classroom.threads.filter(
          (t) => t.type === "assignment"
        ).length,
        announcementCount: classroom.threads.filter(
          (t) => t.type === "announcement"
        ).length,
      },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching classroom details:", error);
    return NextResponse.json(
      { error: "Failed to fetch classroom details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
