import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { forumID: string } }
) {
  const prisma = new PrismaClient();

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 404 }
      );
    }

    const threads = await prisma.thread.findMany({
      where: {
        forum_id: params.forumID,
      },
      include: {
        main_post: {
          include: {
            created_by: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        posts: {
          where: {
            type: "reply",
          },
        },
      },
    });

    const forum = await prisma.forum.findFirst({
      where: {
        id: params.forumID,
      },
    });

    const formattedResponse = {
      id: forum?.id,
      forum_name: forum?.forum_name,
      threads: threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        author: `${thread.main_post?.created_by.first_name} ${thread.main_post?.created_by.last_name}`,
        date: thread.main_post?.createdAt,
        replies: thread.posts.length,
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
