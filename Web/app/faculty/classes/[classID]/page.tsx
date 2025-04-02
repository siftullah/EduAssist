"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  BookOpen,
  GraduationCap,
  Mail,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import AnnouncementCard from "@/app/faculty/classes/_components/AnnouncementCard";
import AssignmentCard from "@/app/faculty/classes/_components/AssignmentCard";
import DiscussionCard from "@/app/faculty/classes/_components/DiscussionCard";

interface ClassDetails {
  id: string;
  name: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  teachers: {
    faculty: {
      id: string;
      name: string;
      email: string;
    }[];
    ta: {
      id: string;
      name: string;
      email: string;
    }[];
  };
  students: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
  }[];
  threads: {
    announcements: {
      id: string;
      title: string;
      description: string;
      createdAt: string;
      author: string;
      attachments: {
        id: string;
        filename: string;
        filepath: string;
      }[];
    }[];
    discussions: {
      id: string;
      title: string;
      description: string;
      createdAt: string;
      author: string;
      attachments: {
        id: string;
        filename: string;
        filepath: string;
      }[];
    }[];
    assignments: {
      id: string;
      title: string;
      description: string;
      createdAt: string;
      author: string;
      assignment: {
        id: string;
        dueDate: string;
        totalMarks: number;
        submissionCount: number;
        pendingGrading: number;
      } | null;
      attachments: {
        id: string;
        filename: string;
        filepath: string;
      }[];
    }[];
  };
  stats: {
    studentCount: number;
    assignmentCount: number;
    announcementCount: number;
  };
}

const fetchClassDetails = async (classId: string): Promise<ClassDetails> => {
  const { data } = await axios.get(`/api/faculty/classes/${classId}`);
  return data;
};

const ClassPage = ({ params }: { params: { classID: string } }) => {
  const router = useRouter();

  const {
    data: classDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["classDetails", params.classID],
    queryFn: () => fetchClassDetails(params.classID),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    toast.error(error instanceof Error ? error.message : "An error occurred");
    return (
      <div className="px-4 sm:px-0 py-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-gray-500 text-center">
              Failed to load class details. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="px-4 sm:px-0 py-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-gray-500 text-center">Class not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <h2 className="mb-6 font-bold text-2xl">{classDetails.name}</h2>

      {/* Class Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Course Details</h3>
                <p className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  {classDetails.course.code} - {classDetails.course.name}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Class Statistics</h3>
                <div className="gap-4 grid grid-cols-2">
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    {classDetails.stats.studentCount} Students
                  </p>
                  <p className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    {classDetails.stats.assignmentCount} Assignments
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Teaching Staff</h3>
                <div className="space-y-2">
                  {classDetails.teachers.faculty.map((faculty) => (
                    <div key={faculty.id} className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-500" />
                      <span>{faculty.name}</span>
                      <a
                        href={`mailto:${faculty.email}`}
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                  {classDetails.teachers.ta.map((ta) => (
                    <div key={ta.id} className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{ta.name} (TA)</span>
                      <a
                        href={`mailto:${ta.email}`}
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Feed Section */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-xl">Class Feed</h3>
          <Button
            onClick={() =>
              router.push(`/faculty/classes/${params.classID}/create-post`)
            }
          >
            <Plus className="mr-2 w-4 h-4" /> Create New Post
          </Button>
        </div>
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-primary data-[state=active]:border-b-2 transition-all"
            >
              All Posts
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-primary data-[state=active]:border-b-2 transition-all"
            >
              Announcements
            </TabsTrigger>
            <TabsTrigger
              value="discussions"
              className="data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-primary data-[state=active]:border-b-2 transition-all"
            >
              Discussions
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-primary data-[state=active]:border-b-2 transition-all"
            >
              Assignments
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="space-y-4">
              <AnnouncementCard
                announcements={classDetails.threads.announcements}
              />
              <DiscussionCard discussions={classDetails.threads.discussions} />
              <AssignmentCard assignments={classDetails.threads.assignments} />
            </div>
          </TabsContent>
          <TabsContent value="announcements">
            <div className="space-y-4">
              <AnnouncementCard
                announcements={classDetails.threads.announcements}
              />
            </div>
          </TabsContent>
          <TabsContent value="discussions">
            <div className="space-y-4">
              <DiscussionCard discussions={classDetails.threads.discussions} />
            </div>
          </TabsContent>
          <TabsContent value="assignments">
            <div className="space-y-4">
              <AssignmentCard assignments={classDetails.threads.assignments} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClassPage;
