export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { classID: string; threadID: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    // Check if the user is a faculty member
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Unauthorized: Faculty access required" },
        { status: 403 }
      );
    }

    const thread = await prisma.classroomThread.findFirst({
      where: {
        id: params.threadID,
        classroom_id: params.classID,
        classroom: {
          teachers: {
            some: {
              user_id: user.id,
            },
          },
        },
      },
      include: {
        posts: {
          include: {
            created_by: true,
            attachments: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        assignments: {
          include: {
            submissions: true,
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found or access denied" },
        { status: 404 }
      );
    }

    const mainPost = thread.posts.find((p) => p.type === "main");
    const replies = thread.posts.filter((p) => p.type === "reply");

    const formattedResponse = {
      id: thread.id,
      title: thread.title,
      type: thread.type,
      mainPost: {
        id: mainPost?.id,
        description: mainPost?.description,
        createdAt: mainPost?.createdAt,
        author: mainPost?.created_by
          ? `${mainPost.created_by.first_name} ${mainPost.created_by.last_name}`
          : "Unknown",
        attachments:
          mainPost?.attachments.map((a) => ({
            id: a.id,
            filename: a.filename,
            filepath: a.filepath,
          })) || [],
      },
      replies: replies.map((reply) => ({
        id: reply.id,
        description: reply.description,
        createdAt: reply.createdAt,
        author: `${reply.created_by.first_name} ${reply.created_by.last_name}`,
        attachments: reply.attachments.map((a) => ({
          id: a.id,
          filename: a.filename,
          filepath: a.filepath,
        })),
      })),
      assignment:
        thread.type === "assignment"
          ? {
              id: thread.assignments[0]?.id,
              dueDate: thread.assignments[0]?.due_date,
              totalMarks: thread.assignments[0]?.total_marks,
              submissionCount: thread.assignments[0]?.submissions.length || 0,
              pendingGrading:
                thread.assignments[0]?.submissions.filter(
                  (s) => s.marks === null
                ).length || 0,
            }
          : null,
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching thread details:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
