"use client";

import React, { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, Calendar, Clock, FileIcon } from "lucide-react";
import Loader from "./_components/Loader";

interface Thread {
  id: string;
  title: string;
  main_post: Post;
  assignment: Assignment;
}

interface Attachment {
  id: string;
  filename: string;
  filepath: string;
}

interface Post {
  id: string;
  description: string;
  created_by: string;
  attachments?: Attachment[];
}

interface Assignment {
  id: string;
  dueDate: string;
  totalMarks: number;
  marks?: number;
  submittedOn?: string;
  attachments: Attachment[];
}

const AssignmentPage = ({ params }: { params: { assignmentId: string } }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [assignmentData, setAssignmentData] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        const response = await fetch(
          `/api/student/assignments/${params.assignmentId}`
        );
        const data = await response.json();
        setAssignmentData(data);
      } catch (error) {
        console.error("Failed to fetch announcement details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [params.assignmentId]);

  if (isLoading) {
    return <Loader />;
  }

  if (!assignmentData) {
    notFound();
  }

  const getSubmissionStatus = () => {
    if (assignmentData.assignment.attachments) {
      return "submitted";
    }
    return "pending";
  };

  const isDeadlinePassed = () => {
    const dueDate = new Date(assignmentData.assignment.dueDate);
    return new Date() > dueDate;
  };

  // const handleDelete = async () => {
  //   if (!confirm("Are you sure you want to delete this submission?")) return;

  //   console.log("deleted");

  // try {
  //   await fetch(
  //     `/api/student/assignments/${params.assignmentId}/submission`,
  //     {
  //       method: "DELETE",
  //     }
  //   );
  //   router.refresh();
  // } catch (error) {
  //   console.error("Failed to delete submission:", error);
  // }
  // };

  const submissionStatus = getSubmissionStatus();

  return (
    <div className="px-4 sm:px-0 py-6">
      <Button onClick={() => router.back()} className="flex items-center mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{assignmentData.title}</CardTitle>
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            {/* <Badge variant="secondary">{classroom?.name}</Badge> */}
            <span>Created by: {assignmentData.main_post.created_by}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold text-lg">Description</h3>
              <p>{assignmentData.main_post.description}</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-lg">Attachments</h3>
              <p>
                {assignmentData.main_post.attachments &&
                  assignmentData.main_post.attachments.map((attachment) => (
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
                  ))}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Calendar className="mr-2 w-4 h-4" />
                <span>
                  Due: {formatDate(assignmentData.assignment.dueDate)}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 w-4 h-4" />
                <span>Total Marks: {assignmentData.assignment.totalMarks}</span>
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-lg">Submission Status</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      submissionStatus === "pending" ? "outline" : "default"
                    }
                  >
                    {submissionStatus}
                  </Badge>
                  {isDeadlinePassed() && submissionStatus === "pending" && (
                    <Badge variant="destructive">Deadline Passed</Badge>
                  )}
                </div>

                {assignmentData.assignment.attachments && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium">Your Submission</h4>
                      <p className="text-gray-600 text-sm">
                        Submitted on:{" "}
                        {formatDate(assignmentData.assignment?.submittedOn)}
                      </p>
                    </div>

                    {assignmentData.assignment.attachments?.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-medium">Submitted Files</h4>
                        {assignmentData.assignment.attachments.map(
                          (attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2 bg-gray-50 mb-2 p-2 rounded-md"
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
                          )
                        )}
                      </div>
                    )}

                    {/* <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className=""
                    >
                      Delete Submission
                    </Button> */}
                  </div>
                )}

                {assignmentData.assignment.marks && (
                  <p className="mt-2">
                    Marks Obtained: {assignmentData.assignment.marks} /{" "}
                    {assignmentData.assignment.totalMarks}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentPage;
