"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import AnnouncementCard from "@/app/student/classes/_components/AnnouncementCard";
import AssignmentCard from "@/app/student/classes/_components/AssignmentCard";
import DiscussionCard from "@/app/student/classes/_components/DiscussionCard";
import Loader from "@/app/student/classes/_components/Loader";
import { ClassroomDetails } from "@/app/types/classroom";

const ClassPage = ({ params }: { params: { classID: string } }) => {
  const [classData, setClassData] = useState<ClassroomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const response = await fetch(`/api/student/classes/${params.classID}`);
        const data = await response.json();
        setClassData(data);
      } catch (error) {
        console.error("Failed to fetch class details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetails();
  }, [params.classID]);

  if (isLoading) {
    return <Loader />;
  }

  if (!classData) {
    notFound();
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <h2 className="mb-6 font-bold text-2xl">{classData.name}</h2>
      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            <div>
              <p>
                <strong>Course Code:</strong> {classData.courseInfo.code}
              </p>
              <p>
                <strong>Instructor:</strong>{" "}
                {classData.teachers.faculty[0]?.name || "Not assigned"}
              </p>
              <p>
                <strong>Teaching Assistant:</strong>{" "}
                {classData.teachers.ta[0]?.name || "Not assigned"}
              </p>
              <p>
                <strong>Enrolled Students:</strong> {classData.studentCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-xl">Class Feed</h3>
          <Button
            onClick={() =>
              router.push(`/student/classes/${params.classID}/create-post`)
            }
          >
            <Plus className="mr-2 w-4 h-4" /> Create New Post
          </Button>
        </div>
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
            >
              All Posts
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
            >
              Announcements
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
            >
              Assignments
            </TabsTrigger>
            <TabsTrigger
              value="discussions"
              className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
            >
              Discussions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="space-y-4">
              <AnnouncementCard
                announcements={classData.threads.announcements}
              />
              <AssignmentCard assignments={classData.threads.assignments} />
              <DiscussionCard discussions={classData.threads.discussions} />
            </div>
          </TabsContent>
          <TabsContent value="announcements">
            <div className="space-y-4">
              <AnnouncementCard
                announcements={classData.threads.announcements}
              />
            </div>
          </TabsContent>
          <TabsContent value="assignments">
            <div className="space-y-4">
              <AssignmentCard assignments={classData.threads.assignments} />
            </div>
          </TabsContent>
          <TabsContent value="discussions">
            <div className="space-y-4">
              <DiscussionCard discussions={classData.threads.discussions} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClassPage;
