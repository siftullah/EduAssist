export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const forumId = formData.get("forumId") as string;
    const batchId = formData.get("batchId") as string;
    const groupName = formData.get("groupName") as string;
    const members = formData
      .getAll("members[]")
      .map((member) => member.toString());
    const attachment = formData.get("attachment") as File | null;

    // Get faculty's information
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
      include: {
        department: true,
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Create thread based on type
    const result = await prisma.$transaction(async (tx) => {
      let groupId: string | null = null;

      // Handle group creation for different types
      if (type === "private" && groupName && members.length > 0) {
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
                      { user_id: user.id },
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
      } else if (type === "batch" && batchId) {
        const batchGroup = await tx.batchGroup.findUnique({
          where: { batch_id: batchId },
        });
        groupId = batchGroup?.group_id || null;
      } else if (type === "department") {
        const departmentGroup = await tx.departmentGroup.findUnique({
          where: { department_id: faculty.department.id },
        });
        groupId = departmentGroup?.group_id || null;
      }

      // Create thread and its main post
      const thread = await tx.thread.create({
        data: {
          title,
          type: "discussion",
          university_id: faculty.department.university_id,
          forum_id: type === "general" ? forumId : null,
          group_id: groupId,
          posts: {
            create: {
              type: "main",
              description,
              user_id: user.id,
              // Handle attachment if needed
              ...(attachment && {
                attachments: {
                  create: {
                    filename: attachment.name,
                    filepath: "path/to/store", // Implement file storage logic
                  },
                },
              }),
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
