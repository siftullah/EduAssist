"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Dashboard } from "@/app/faculty/types/dashboard";

const fetchDashboardData = async () => {
  const { data } = await axios.get<Dashboard>("/api/faculty/dashboard");
  return data;
};

const FacultyDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["facultyDashboard"],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h1 className="mb-6 font-semibold text-3xl">Faculty Dashboard</h1>
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <DashboardCard
          title="Active Classes"
          value={data?.stats.activeClasses.toString() || "0"}
          icon={<BookOpen size={24} />}
        />
        <DashboardCard
          title="Total Assignments"
          value={data?.stats.totalAssignments.toString() || "0"}
          icon={<FileText size={24} />}
        />
        <DashboardCard
          title="Total Students"
          value={data?.stats.totalStudents.toString() || "0"}
          icon={<Users size={24} />}
        />
      </div>
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        <RecentAssignments assignments={data?.recentAssignments || []} />
        <RecentDiscussions discussions={data?.recentDiscussions || []} />
      </div>
    </>
  );
};

const DashboardCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) => {
  return (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className="bg-blue-100 mr-4 p-3 rounded-full text-blue-600">
          {icon}
        </div>
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="font-semibold text-2xl">{value}</CardTitle>
        </div>
      </CardContent>
    </Card>
  );
};

const RecentAssignments = ({
  assignments,
}: {
  assignments: Dashboard["recentAssignments"];
}) => {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{assignment.classroom_name}</p>
                <p className="text-gray-500 text-sm">
                  Total Marks: {assignment.total_marks}
                </p>
              </div>
              <span className="bg-blue-100 px-2 py-1 rounded text-blue-600 text-sm">
                Due: {new Date(assignment.due_date).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full"
          onClick={() => router.push("/faculty/assignments")}
        >
          View All Assignments
        </Button>
      </CardContent>
    </Card>
  );
};

const RecentDiscussions = ({
  discussions,
}: {
  discussions: Dashboard["recentDiscussions"];
}) => {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Discussions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {discussions.map((discussion) => (
            <li
              key={discussion.id}
              className="flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{discussion.title}</p>
                <p className="text-gray-500 text-sm">
                  {discussion.author} - {discussion.classroom_name}
                </p>
              </div>
              <span className="bg-green-100 px-2 py-1 rounded text-green-600 text-sm">
                {discussion.replies} replies
              </span>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full"
          onClick={() => router.push("/faculty/discussions")}
        >
          View All Discussions
        </Button>
      </CardContent>
    </Card>
  );
};

export default FacultyDashboard;
