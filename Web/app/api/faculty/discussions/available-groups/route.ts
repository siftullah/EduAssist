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

    // Get faculty's info including university and department/batch
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
      include: {
        department: true,
      },
    });

    const batches = await prisma.batch.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get available forums (public or in student's groups)
    const forums = await prisma.forum.findMany({
      where: {
        university_id: faculty.department.university_id,
        OR: [
          { group_id: null }, // Public forums
          {
            group_id: {
              in: [
                faculty.department.id, // department forums
                ...(batches.map((batch) => batch.id) || []), // batch forums
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

    const departments = [
      {
        id: faculty.department.id,
        name: faculty.department.name,
      },
    ];

    return NextResponse.json({
      forums,
      batches,
      departments,
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
