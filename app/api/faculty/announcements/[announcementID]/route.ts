export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { announcementID: string } }
) {
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

    // Get annoucement details
    const thread = await prisma.thread.findFirst({
      where: {
        id: announcementId,
      },
      include: {
        posts: {
          include: {
            created_by: true,
            attachments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Announcement not found or access denied" },
        { status: 404 }
      );
    }

    const mainPost = thread.posts.find(
      (post) => post.id === thread.main_post_id
    );

    const postReplies = thread.posts.filter((post) => post.type === "reply");

    const formattedResponse = {
      id: thread.id,
      title: thread.title,
      main_post: {
        id: mainPost?.id,
        description: mainPost?.description,
        created_by: `${mainPost?.created_by.first_name} ${mainPost?.created_by.last_name}`,
        attachments: mainPost?.attachments.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          filepath: attachment.filepath,
        })),
      },
      replies: postReplies.map((post) => ({
        id: post.id,
        description: post.description,
        created_by: `${post.created_by.first_name} ${post.created_by.last_name}`,
        attachments: post?.attachments.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          filepath: attachment.filepath,
        })),
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching discussion details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
