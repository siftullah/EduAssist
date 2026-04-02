import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function POST(request: Request) {
  const prisma = new PrismaClient();

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    const { title, description, type, forumId, groupName, members } =
      await request.json();

    // Get student's university
    const student = await prisma.student.findUnique({
      where: { user_id: user.id },
      include: {
        department_batch: {
          include: {
            batch: true,
            department: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Create thread based on type
    const result = await prisma.$transaction(async (tx) => {
      let groupId: string | null = null;

      // Handle group creation for different types
      if (type === "private") {
        // Create custom group with creator included in members
        const group = await tx.group.create({
          data: {
            name: groupName,
            type: "custom",
            custom: {
              create: {
                user_id: user.id,
                members: {
                  createMany: {
                    data: [
                      { user_id: user.id }, // Add creator
                      ...members.map((memberId: string) => ({
                        user_id: memberId,
                      })),
                    ],
                  },
                },
              },
            },
          },
        });
        groupId = group.id;
      } else if (type === "batch") {
        const batchGroup = await tx.batchGroup.findUnique({
          where: { batch_id: student.department_batch.batch.id },
        });
        groupId = batchGroup?.group_id || null;
      } else if (type === "department") {
        const departmentGroup = await tx.departmentGroup.findUnique({
          where: { department_id: student.department_batch.department.id },
        });
        groupId = departmentGroup?.group_id || null;
      }

      // Create thread and its main post
      const thread = await tx.thread.create({
        data: {
          title,
          type: "discussion",
          university_id: student.department_batch.batch.university_id,
          forum_id: type === "general" ? forumId : null,
          group_id: groupId,
          posts: {
            create: {
              type: "main",
              description,
              user_id: user.id,
            },
          },
        },
        include: {
          posts: true,
        },
      });

      // Update thread with main_post_id
      await tx.thread.update({
        where: { id: thread.id },
        data: { main_post_id: thread.posts[0].id },
      });

      return thread;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating discussion:", error);
    return NextResponse.json(
      { error: "Failed to create discussion" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
