export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient()
  
  try {
    // Get current user and verify university_id
    const user = await currentUser()
    if (!user?.publicMetadata['university_id']) {
      return NextResponse.json({ error: 'University ID of authenticated user not found' }, { status: 401 })
    }
    const university_id = user.publicMetadata['university_id'] as string

    // Get counts for all entities
    const studentCount = await prisma.student.count({
      where: {
        department_batch: {
          department: {
            university_id
          }
        }
      }
    })

    const facultyCount = await prisma.faculty.count({
      where: {
        department: {
          university_id
        }
      }
    })

    const courseCount = await prisma.course.count({
      where: {
        department: {
          university_id
        }
      }
    })

    const classroomCount = await prisma.classroom.count({
      where: {
        course: {
          department: {
            university_id
          }
        }
      }
    })

    const departmentCount = await prisma.department.count({
      where: {
        university_id
      }
    })

    const batchCount = await prisma.batch.count({
      where: {
        university_id
      }
    })

    const adminCount = await prisma.uniAdministration.count({
      where: {
        role: {
          university_id
        }
      }
    })

    const forumCount = await prisma.forum.count({
      where: {
        university_id
      }
    })

    const threadCount = await prisma.thread.count({
      where: {
        university_id
      }
    })

    const postCount = await prisma.threadPost.count({
      where: {
        thread: {
          university_id
        }
      }
    })

    await prisma.$disconnect()
    return NextResponse.json([
      { name: "Total Students", value: studentCount, icon: "Users", color: "text-blue-500" },
      { name: "Total Faculty", value: facultyCount, icon: "GraduationCap", color: "text-green-500" },
      { name: "Total Courses", value: courseCount, icon: "BookOpen", color: "text-yellow-500" },
      { name: "Total Classrooms", value: classroomCount, icon: "School", color: "text-purple-500" },
      { name: "Total Departments", value: departmentCount, icon: "Building2", color: "text-red-500" },
      { name: "Total Batches", value: batchCount, icon: "Users2", color: "text-indigo-500" },
      { name: "Total Administrators", value: adminCount, icon: "ShieldCheck", color: "text-orange-500" },
      { name: "Total Forums", value: forumCount, icon: "MessagesSquare", color: "text-teal-500" },
      { name: "Total Threads", value: threadCount, icon: "MessageCircle", color: "text-pink-500" },
      { name: "Total Posts", value: postCount, icon: "MessageSquare", color: "text-cyan-500" }
    ])

  } catch (error) {
    console.error('Error fetching stats:', error)
    await prisma.$disconnect()
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}