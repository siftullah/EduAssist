export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const prisma = new PrismaClient();

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 404 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { user_id: user.id },
      include: {
        user: true,
        department_batch: {
          include: {
            batch: {
              include: {
                university: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      first_name: student.user.first_name,
      last_name: student.user.last_name,
      email: student.user.email_address,
      roll_number: student.roll_number,
      batch: student.department_batch.batch.name,
      university: student.department_batch.batch.university.name,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
  const prisma = new PrismaClient();

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 404 }
      );
    }

    const { first_name, last_name, email } = await request.json();

    const updatedStudent = await prisma.student.update({
      where: { user_id: user.id },
      data: {
        user: {
          update: {
            first_name,
            last_name,
            email_address: email,
          },
        },
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
