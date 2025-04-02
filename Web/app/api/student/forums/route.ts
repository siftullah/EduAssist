export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
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

    // Get student details including department and batch info
    const student = await prisma.student.findFirst({
      where: { user_id: user.id },
      include: {
        department_batch: {
          include: {
            department: true,
            batch: true,
          },
        },
      },
    });

    if (!student) {
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

    // Get department and batch groups
    const [departmentGroup, batchGroup] = await Promise.all([
      prisma.departmentGroup.findFirst({
        where: { department_id: student.department_batch.department.id },
        select: { group_id: true },
      }),
      prisma.batchGroup.findFirst({
        where: { batch_id: student.department_batch.batch.id },
        select: { group_id: true },
      }),
    ]);

    // Get forums that are either public (group_id is null) or belong to student's groups
    const forums = await prisma.forum.findMany({
      where: {
        OR: [
          { group_id: null }, // Public forums
          {
            group_id: {
              in: [
                ...(departmentGroup ? [departmentGroup.group_id] : []),
                ...(batchGroup ? [batchGroup.group_id] : []),
                ...customGroupIds,
              ],
            },
          }, // Forums in student's groups
        ],
      },
      include: {
        group: true, // Include group details if it exists
        threads: {
          select: {
            id: true,
            posts: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
              select: {
                createdAt: true,
              },
            },
          },
        },
      },
    });

    const formattedResponse = {
      forums: forums.map((forum) => ({
        id: forum.id,
        title: forum.forum_name,
        group_name: forum.group?.name || "General",
        thread_count: forum.threads.length,
        last_activity:
          forum.threads
            .flatMap((thread) => thread.posts)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
            ?.createdAt || forum.createdAt,
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching forums:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
