"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Loader2, Users, BookOpen, CheckSquare } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Class {
  id: string;
  name: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  studentCount: number;
  assignmentStats: {
    total: number;
    pendingGrading: number;
  };
}

interface ClassesResponse {
  classes: Class[];
}

const fetchClasses = async (): Promise<ClassesResponse> => {
  const { data } = await axios.get("/api/faculty/classes");
  return data;
};

const Classes = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["facultyClasses"],
    queryFn: fetchClasses,
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
        <h1 className="mb-6 font-semibold text-3xl">My Classes</h1>
        <Card>
          <CardContent className="py-8">
            <div className="text-gray-500 text-center">
              Failed to load classes. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.classes || data.classes.length === 0) {
    return (
      <div className="px-4 sm:px-0 py-6">
        <h1 className="mb-6 font-semibold text-3xl">My Classes</h1>
        <Card>
          <CardContent className="py-8">
            <div className="text-gray-500 text-center">
              No classes found. Please contact the administrator.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <h1 className="mb-6 font-semibold text-3xl">My Classes</h1>
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        {data.classes.map((cls) => (
          <Card key={cls.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {cls.course.code} - {cls.course.name}
                  </CardDescription>
                </div>
                {cls.assignmentStats.pendingGrading > 0 && (
                  <Badge variant="destructive">
                    {cls.assignmentStats.pendingGrading} Pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="gap-4 grid grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{cls.studentCount} Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span>{cls.assignmentStats.total} Assignments</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/faculty/assignments?classId=${cls.id}`}>
                    <Button
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Assignments
                    </Button>
                  </Link>
                  <Link href={`/faculty/students?classId=${cls.id}`}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Students
                    </Button>
                  </Link>
                  <Link href={`/faculty/classes/${cls.id}`}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Classes;
