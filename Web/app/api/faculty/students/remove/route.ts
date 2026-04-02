export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    const { enrollmentId } = await request.json();

    // Verify faculty has access to this enrollment
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
      include: {
        user: {
          include: {
            classroom_teachers: {
              where: {
                classroom: {
                  enrollments: {
                    some: {
                      id: enrollmentId,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!faculty || faculty.user.classroom_teachers.length === 0) {
      return NextResponse.json(
        { error: "Unauthorized to remove this student" },
        { status: 403 }
      );
    }

    // Remove the enrollment
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to remove student" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
