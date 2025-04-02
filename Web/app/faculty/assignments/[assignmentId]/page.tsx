"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, FileIcon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Assignment {
  id: string;
  thread_id: string;
  title: string;
  description: string;
  created_by: string;
  attachments: {
    id: string;
    filename: string;
    filepath: string;
  }[];
  dueDate: string;
  totalMarks: number;
  classroom: {
    id: string;
    name: string;
    course: {
      id: string;
      name: string;
      code: string;
    };
  };
  submissions: {
    total: number;
    enrolled: number;
    items: {
      id: string;
      student: {
        id: string;
        name: string;
        email: string;
      };
      submittedOn: string;
      marks: number | null;
      attachments: {
        id: string;
        filename: string;
        filepath: string;
      }[];
    }[];
  };
}

const fetchAssignment = async (assignmentId: string): Promise<Assignment> => {
  const { data } = await axios.get(`/api/faculty/assignments/${assignmentId}`);
  return data;
};

const FacultyAssignmentPage = ({
  params,
}: {
  params: { assignmentId: string };
}) => {
  const router = useRouter();

  const {
    data: assignment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["assignment", params.assignmentId],
    queryFn: () => fetchAssignment(params.assignmentId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isInvalidData = !assignment || !assignment.classroom?.course;

  if (isError || isInvalidData) {
    return (
      <div className="px-4 sm:px-0 py-6">
        <Button
          onClick={() => router.back()}
          className="flex items-center mb-4"
        >
          <ArrowLeftIcon className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-gray-500 text-center">
              {isError
                ? error instanceof Error
                  ? error.message
                  : "Failed to fetch assignment"
                : "Assignment not found or invalid data"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <Button onClick={() => router.back()} className="flex items-center mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <div className="flex items-center text-gray-500 text-sm">
            <Badge variant="secondary" className="mr-2">
              {assignment.classroom.course.code} -{" "}
              {assignment.classroom.course.name}
            </Badge>
            <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Description</h3>
              <p>{assignment.description}</p>
            </div>
            <div>
              <h3 className="font-semibold">Attachments</h3>
              {assignment.attachments?.length > 0 ? (
                assignment.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 bg-gray-50 mb-4 p-2 rounded-md"
                  >
                    <FileIcon className="w-4 h-4" />
                    <a
                      href={attachment.filepath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {attachment.filename}
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No attachments</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold">Total Marks</h3>
              <p>{assignment.totalMarks}</p>
            </div>
            <div>
              <h3 className="font-semibold">Submission Statistics</h3>
              <p>
                Submitted: {assignment.submissions?.total || 0} /{" "}
                {assignment.submissions?.enrolled || 0}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  router.push(
                    `/faculty/assignments/${assignment.id}/submissions`
                  )
                }
              >
                View Submissions
              </Button>
              <Button
                variant="default"
                onClick={() =>
                  router.push(`/faculty/assignments/${assignment.id}/edit`)
                }
              >
                Edit Assignment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyAssignmentPage;
