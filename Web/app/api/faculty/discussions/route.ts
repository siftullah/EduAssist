export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 404 }
      );
    }

    // Get student details including department and batch info
    const faculty = await prisma.faculty.findFirst({
      where: { user_id: user.id },
      include: {
        department: true,
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get all custom groups the student is part of
    const customGroupMemberships = await prisma.customGroupMembers.findMany({
      where: { user_id: user.id },
      select: { custom_group: { select: { group_id: true } } },
    });

    const customGroupIds = customGroupMemberships.map(
      (membership) => membership.custom_group.group_id
    );

    const departmentGroup = await prisma.departmentGroup.findFirst({
      where: { department_id: faculty.department.id },
      select: { group_id: true },
    });

    // Get all batch groups as faculty can view all batches
    const batchGroups = await prisma.batchGroup.findMany({
      select: { group_id: true },
    });

    // Fetch all relevant threads
    const threads = await prisma.thread.findMany({
      where: {
        type: "discussion",
        OR: [
          { forum_id: { not: null } }, // General discussions
          {
            AND: [
              { group_id: { not: null } },
              {
                group_id: {
                  in: [
                    ...(departmentGroup ? [departmentGroup.group_id] : []),
                    ...(batchGroups.map((batchGroup) => batchGroup.group_id) ||
                      []),
                    ...customGroupIds,
                  ],
                },
              },
            ],
          },
        ],
      },
      include: {
        main_post: {
          include: {
            created_by: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        posts: {
          where: { type: "reply" },
          select: { id: true },
        },
        group: true,
      },
    });

    const formattedResponse = {
      threads: threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        type: thread.forum_id
          ? "general"
          : batchGroups.find(
              (batchGroup) => batchGroup.group_id === thread.group_id
            )
          ? "batch"
          : thread.group_id === departmentGroup?.group_id
          ? "department"
          : "custom",
        main_post: {
          id: thread.main_post?.id,
          description: thread.main_post?.description,
          created_by: `${thread.main_post?.created_by.first_name} ${thread.main_post?.created_by.last_name}`,
        },
        reply_count: thread.posts.length,
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching discussions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
