export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
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

    // Get faculty data including their classrooms
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
      include: {
        user: {
          include: {
            classroom_teachers: {
              include: {
                classroom: {
                  include: {
                    threads: {
                      include: {
                        posts: {
                          include: {
                            created_by: {
                              select: {
                                first_name: true,
                                last_name: true,
                              },
                            },
                          },
                        },
                      },
                      orderBy: {
                        createdAt: "desc",
                      },
                      take: 3,
                    },
                    assignments: {
                      orderBy: {
                        due_date: "desc",
                      },
                      take: 3,
                    },
                    enrollments: true,
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

    // Calculate statistics
    const activeClasses = faculty.user.classroom_teachers.length;

    const totalAssignments = faculty.user.classroom_teachers.reduce(
      (sum, ct) => sum + ct.classroom.assignments.length,
      0
    );

    const totalStudents = new Set(
      faculty.user.classroom_teachers.flatMap((ct) =>
        ct.classroom.enrollments.map((e) => e.student_id)
      )
    ).size;

    // Get recent assignments
    const recentAssignments = faculty.user.classroom_teachers
      .flatMap((ct) =>
        ct.classroom.assignments.map((assignment) => ({
          id: assignment.id,
          classroom_name: ct.classroom.name,
          total_marks: assignment.total_marks,
          due_date: assignment.due_date,
        }))
      )
      .sort((a, b) => b.due_date.getTime() - a.due_date.getTime())
      .slice(0, 3);

    // Get recent discussions
    const recentDiscussions = faculty.user.classroom_teachers
      .flatMap((ct) =>
        ct.classroom.threads.map((thread) => ({
          id: thread.id,
          title: thread.title,
          classroom_name: ct.classroom.name,
          author: thread.posts[0]?.created_by
            ? `${thread.posts[0].created_by.first_name} ${thread.posts[0].created_by.last_name}`
            : "Unknown",
          replies: thread.posts.filter((post) => post.type === "reply").length,
        }))
      )
      .sort((a, b) => b.replies - a.replies)
      .slice(0, 3);

    return NextResponse.json({
      stats: {
        activeClasses,
        totalAssignments,
        totalStudents,
      },
      recentAssignments,
      recentDiscussions,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
