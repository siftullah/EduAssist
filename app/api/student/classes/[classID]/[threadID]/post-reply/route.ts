import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { threadID: string } }
) {
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

    const threadId = params.threadID;

    const { reply } = await request.json();

    // POST reply on thread in post table

    await prisma.classroomPost.create({
      data: {
        type: "reply",
        description: reply,
        created_by: {
          connect: {
            id: user.id,
          },
        },
        thread: {
          connect: {
            id: threadId,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error posting reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
