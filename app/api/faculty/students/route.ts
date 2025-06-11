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

    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
      include: {
        user: {
          include: {
            classroom_teachers: {
              include: {
                classroom: {
                  include: {
                    enrollments: {
                      include: {
                        student: {
                          include: {
                            user: {
                              select: {
                                first_name: true,
                                last_name: true,
                              },
                            },
                          },
                        },
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

    // Format the response
    const classes = faculty.user.classroom_teachers.map((ct) => ({
      id: ct.classroom.id,
      name: ct.classroom.name,
    }));

    const students = faculty.user.classroom_teachers.flatMap((ct) =>
      ct.classroom.enrollments.map((enrollment) => ({
        id: enrollment.id,
        classroom_id: ct.classroom.id,
        student_id: enrollment.student.id,
        name: `${enrollment.student.user.first_name} ${enrollment.student.user.last_name}`,
        roll_number: enrollment.student.roll_number,
      }))
    );

    return NextResponse.json({
      classes,
      students,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
