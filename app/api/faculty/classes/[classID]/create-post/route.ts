export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { classID: string } }
) {
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
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Unauthorized: Faculty access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as "announcement" | "discussion";
    const attachment = formData.get("attachment") as File | null;

    // Create the thread and its main post in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the thread first
      const thread = await tx.classroomThread.create({
        data: {
          title,
          type,
          classroom_id: params.classID,
          posts: {
            create: {
              type: "main",
              description,
              user_id: user.id,
              ...(attachment && {
                attachments: {
                  create: {
                    filename: attachment.name,
                    filepath: "placeholder-path", // Replace with actual file upload logic
                  },
                },
              }),
            },
          },
        },
        include: {
          posts: {
            include: {
              attachments: true,
            },
          },
        },
      });

      // Update the thread with the main post
      await tx.classroomThread.update({
        where: { id: thread.id },
        data: { main_post_id: thread.posts[0].id },
      });

      return thread;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
