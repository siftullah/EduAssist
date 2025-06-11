"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (isError || !data?.assignment) {
    return (
      <div className="px-6 py-8">
        <Button onClick={() => router.back()} variant="outline" className="mb-4">
          <ArrowLeftIcon className="mr-2 w-4 h-4" /> Back
        </Button>
        <Card className="rounded-xl shadow border border-red-200">
          <CardContent className="py-8 text-center text-red-600">
            Assignment not found or failed to load submissions
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assignment, submissions, totalEnrolled } = data;

  return (
    <div className="px-6 py-8 space-y-6">
      <ToastContainer />
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow">
        <Button onClick={() => router.back()} variant="ghost" className="text-white mb-3">
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{assignment.title} - Submissions</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-blue-100">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {assignment.classroom.course.code} - {assignment.classroom.name}
          </Badge>
          <span>Total Submissions: {submissions.length} / {totalEnrolled}</span>
        </div>
      </div>

      <Card className="rounded-2xl shadow">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Submitted On</TableHead>
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
                  <TableCell>{new Date(submission.submittedOn).toLocaleString()}</TableCell>
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
