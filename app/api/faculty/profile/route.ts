export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
      include: {
        user: true,
        department: {
          include: {
            university: true,
          },
        },
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    return NextResponse.json({
      first_name: faculty.user.first_name,
      last_name: faculty.user.last_name,
      email: faculty.user.email_address,
      designation: faculty.designation,
      department: faculty.department.name,
      university: faculty.department.university.name,
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
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated User" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, designation } = body;

    const faculty = await prisma.faculty.findUnique({
      where: { user_id: user.id },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Update user information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        first_name,
        last_name,
      },
    });

    // Update faculty information
    const updatedFaculty = await prisma.faculty.update({
      where: { user_id: user.id },
      data: {
        designation,
      },
      include: {
        user: true,
        department: {
          include: {
            university: true,
          },
        },
      },
    });

    return NextResponse.json({
      first_name: updatedFaculty.user.first_name,
      last_name: updatedFaculty.user.last_name,
      email: updatedFaculty.user.email_address,
      designation: updatedFaculty.designation,
      department: updatedFaculty.department.name,
      university: updatedFaculty.department.university.name,
    });
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
