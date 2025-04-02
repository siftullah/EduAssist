import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function GET(request: Request) {
  const prisma = new PrismaClient();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    // Get current student's university
    const student = await prisma.student.findUnique({
      where: { user_id: user.id },
      include: {
        department_batch: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Search for students in the same university
    const students = await prisma.student.findMany({
      where: {
        department_batch: {
          batch: {
            university_id: student.department_batch.batch.university_id,
          },
        },
        NOT: {
          user_id: user.id, // Exclude current user
        },
        OR: [
          {
            user: {
              first_name: {
                contains: query || "",
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              last_name: {
                contains: query || "",
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      take: 10, // Limit results
    });

    return NextResponse.json({
      students: students.map((s) => ({
        id: s.user.id,
        first_name: s.user.first_name,
        last_name: s.user.last_name,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
