import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { classID: string } }
) {
  const prisma = new PrismaClient();

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    const { title, description } = await request.json();

    // Create the thread and its main post in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the thread first
      const thread = await tx.classroomThread.create({
        data: {
          title,
          type: "discussion",
          classroom_id: params.classID,
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
