import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentID: string } }
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

    const assignmentId = params.assignmentID;

    // Get annoucement details
    const thread = await prisma.classroomThread.findFirst({
      where: {
        id: assignmentId,
      },
      include: {
        posts: {
          include: {
            created_by: true,
            attachments: true,
          },
        },
        assignments: {
          include: {
            submissions: {
              where: {
                student: {
                  user_id: user.id,
                },
              },
              include: {
                attachments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(thread);

    if (!thread) {
      return NextResponse.json(
        { error: "Annoucement not found or access denied" },
        { status: 404 }
      );
    }

    const mainPost = thread.posts.find(
      (post) => post.id === thread.main_post_id
    );

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
      assignment: {
        id: thread.assignments[0].id,
        dueDate: thread.assignments[0].due_date,
        totalMarks: thread.assignments[0].total_marks,
        marks: thread.assignments[0].submissions[0]?.marks,
        submittedOn: thread.assignments[0].submissions[0]?.submitted_on,
        attachments: thread.assignments[0].submissions[0]?.attachments.map(
          (attachment) => ({
            id: attachment.id,
            filename: attachment.filename,
            filepath: attachment.filepath,
          })
        ),
      },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
