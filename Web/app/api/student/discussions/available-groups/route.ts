export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const prisma = new PrismaClient();

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    // Get student's info including university and department/batch
    const student = await prisma.student.findUnique({
      where: { user_id: user.id },
      include: {
        department_batch: {
          include: {
            batch: {
              include: {
                university: true,
              },
            },
            department: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get available forums (public or in student's groups)
    const forums = await prisma.forum.findMany({
      where: {
        university_id: student.department_batch.batch.university_id,
        OR: [
          { group_id: null }, // Public forums
          {
            group_id: {
              in: [
                student.department_batch.batch.id, // Batch forums
                student.department_batch.department.id, // Department forums
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        forum_name: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get batch and department info
    const batch = {
      id: student.department_batch.batch.id,
      name: student.department_batch.batch.name,
    };

    const department = {
      id: student.department_batch.department.id,
      name: student.department_batch.department.name,
    };

    return NextResponse.json({
      forums,
      batch,
      department,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch available groups" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
