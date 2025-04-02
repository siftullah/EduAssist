import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { announcementID: string } }
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

    const announcementId = params.announcementID;

    const { reply } = await request.json();

    // POST reply on thread in post table

    await prisma.threadPost.create({
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
            id: announcementId,
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
