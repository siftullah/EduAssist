"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftIcon, FileIcon, Loader2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Submission {
  id: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    email: string;
  };
  submittedOn: string;
  marks: number | null;
  attachments: {
    id: string;
    filename: string;
    filepath: string;
  }[];
}

interface Assignment {
  id: string;
  title: string;
  totalMarks: number;
  dueDate: string;
  classroom: {
    id: string;
    name: string;
    course: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface SubmissionsResponse {
  assignment: Assignment;
  submissions: Submission[];
  totalEnrolled: number;
}

interface UpdateMarksParams {
  assignmentId: string;
  submissionId: string;
  marks: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

const fetchSubmissions = async (
  assignmentId: string
): Promise<SubmissionsResponse> => {
  const { data } = await axios.get(
    `/api/faculty/assignments/${assignmentId}/submissions`
  );
  return data;
};

const updateSubmissionMarks = async ({
  assignmentId,
  submissionId,
  marks,
}: UpdateMarksParams) => {
  const { data } = await axios.put(
    `/api/faculty/assignments/${assignmentId}/submissions`,
    {
      submissionId,
      marks,
    }
  );
  return data;
};

const SubmissionsPage = ({ params }: { params: { assignmentId: string } }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<{ [key: string]: string }>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["submissions", params.assignmentId],
    queryFn: () => fetchSubmissions(params.assignmentId),
  });

  // Initialize marks state when data is loaded
  useEffect(() => {
    if (data?.submissions) {
      const marksState: { [key: string]: string } = {};
      data.submissions.forEach((submission: Submission) => {
        marksState[submission.id] = submission.marks?.toString() || "";
      });
      setMarks(marksState);
    }
  }, [data?.submissions]);

  const mutation = useMutation({
    mutationFn: updateSubmissionMarks,
    onSuccess: () => {
      toast.success("Marks updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["submissions", params.assignmentId],
      });
    },
    onError: (error: unknown) => {
      console.error("Error:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.error ||
          apiError.message ||
          "Failed to update marks"
      );
    },
  });

  const handleMarkSubmission = (submissionId: string) => {
    if (!marks[submissionId]) return;

    mutation.mutate({
      assignmentId: params.assignmentId,
      submissionId,
      marks: marks[submissionId],
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError || !data?.assignment) {
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
              Assignment not found or failed to load submissions
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assignment, submissions, totalEnrolled } = data;

  return (
    <div className="px-4 sm:px-0 py-6">
      <ToastContainer />
      <Button onClick={() => router.back()} className="flex items-center mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{assignment.title} - Submissions</CardTitle>
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <Badge variant="secondary">
              {assignment.classroom.course.code} - {assignment.classroom.name}
            </Badge>
            <span>
              Total Submissions: {submissions.length} / {totalEnrolled}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Attachments</TableHead>
                <TableHead>Marks ({assignment.totalMarks})</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.student.name}</TableCell>
                  <TableCell>{submission.student.rollNumber}</TableCell>
                  <TableCell>
                    {new Date(submission.submittedOn).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {submission.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.filepath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <FileIcon className="w-4 h-4" />
                          {attachment.filename}
                        </a>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max={assignment.totalMarks}
                      value={marks[submission.id]}
                      onChange={(e) =>
                        setMarks({
                          ...marks,
                          [submission.id]: e.target.value,
                        })
                      }
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleMarkSubmission(submission.id)}
                      disabled={
                        (mutation.isPending &&
                          mutation.variables?.submissionId === submission.id) ||
                        !marks[submission.id] ||
                        marks[submission.id] === submission.marks?.toString()
                      }
                    >
                      {mutation.isPending &&
                        mutation.variables?.submissionId === submission.id && (
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        )}
                      {submission.marks ? "Update" : "Mark"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionsPage;
