export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
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

    // Get student details including their classes
    const studentWithClasses = await prisma.student.findFirst({
      where: {
        user_id: user.id,
      },
      include: {
        enrollments: {
          include: {
            classroom: {
              include: {
                course: true,
                teachers: {
                  include: {
                    user: true,
                  },
                  where: {
                    type: "faculty",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!studentWithClasses) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    const classes = studentWithClasses.enrollments.map((enrollment) => ({
      id: enrollment.classroom.id,
      name: enrollment.classroom.name,
      course_code: enrollment.classroom.course.course_code,
      course_name: enrollment.classroom.course.course_name,
      teacher: enrollment.classroom.teachers[0]?.user
        ? `${enrollment.classroom.teachers[0].user.first_name} ${enrollment.classroom.teachers[0].user.last_name}`
        : "Unknown",
    }));

    await prisma.$disconnect();
    return NextResponse.json(classes);
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "Failed to fetch classes for student" },
      { status: 500 }
    );
  }
}
