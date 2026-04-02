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

    // Get faculty details including their classes
    const facultyWithClasses = await prisma.faculty.findFirst({
      where: {
        user_id: user.id,
      },
      include: {
        user: {
          include: {
            classroom_teachers: {
              include: {
                classroom: {
                  include: {
                    course: true,
                    enrollments: true,
                    assignments: {
                      include: {
                        submissions: true,
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

    if (!facultyWithClasses) {
      return NextResponse.json(
        { error: "Faculty record not found" },
        { status: 404 }
      );
    }

    // Format the response
    const classes = facultyWithClasses.user.classroom_teachers.map((ct) => ({
      id: ct.classroom.id,
      name: ct.classroom.name,
      course: {
        id: ct.classroom.course.id,
        code: ct.classroom.course.course_code,
        name: ct.classroom.course.course_name,
      },
      studentCount: ct.classroom.enrollments.length,
      assignmentStats: {
        total: ct.classroom.assignments.length,
        pendingGrading: ct.classroom.assignments.reduce(
          (acc, assignment) =>
            acc +
            assignment.submissions.filter((sub) => sub.marks === null).length,
          0
        ),
      },
    }));

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
