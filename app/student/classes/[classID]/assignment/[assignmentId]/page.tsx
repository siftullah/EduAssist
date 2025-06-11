"use client";

import type React from "react";

import { useState } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileIcon,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Loader from "./_components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

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

// Axios function to fetch assignment details
const fetchAssignmentDetails = async (
  assignmentId: string
): Promise<Thread> => {
  try {
    const { data } = await axios.get(
      `/api/student/assignments/${assignmentId}`
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch assignment details"
      );
    }
    throw error;
  }
};

const AssignmentPage = ({
  params,
}: {
  params: { assignmentId: string; classID: string };
}) => {
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query hook for fetching assignment details
  const {
    data: assignmentData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assignmentDetails", params.assignmentId],
    queryFn: () => fetchAssignmentDetails(params.assignmentId),
  });

  // Mutation hook for submitting assignment
  const { mutate: submitAssignment, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      // This is a simulation - in a real app, you would implement file upload to the API
      // Simulate upload progress
      let progress = 0;
      const updateProgress = () => {
        progress += 5;
        setUploadProgress(progress);
        if (progress < 100) {
          setTimeout(updateProgress, 100);
        }
      };

      updateProgress();

      // Simulate API call completion after "upload" completes
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 2000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted successfully.",
      });

      // Update local data to reflect submission
      if (assignmentData) {
        queryClient.setQueryData(["assignmentDetails", params.assignmentId], {
          ...assignmentData,
          assignment: {
            ...assignmentData.assignment,
            submittedOn: new Date().toISOString(),
            attachments: uploadFiles.map((file, index) => ({
              id: `temp-${index}`,
              filename: file.name,
              filepath: URL.createObjectURL(file),
            })),
          },
        });
      }

      setUploadFiles([]);
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error("Failed to submit assignment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assignment. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Mutation hook for deleting submission
  const { mutate: deleteSubmission, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Submission deleted",
        description: "Your submission has been deleted successfully.",
      });

      // Update local data to reflect deletion
      if (assignmentData) {
        queryClient.setQueryData(["assignmentDetails", params.assignmentId], {
          ...assignmentData,
          assignment: {
            ...assignmentData.assignment,
            submittedOn: undefined,
            attachments: [],
          },
        });
      }
    },
    onError: (error) => {
      console.error("Failed to delete submission:", error);
      toast({
        title: "Error",
        description: "Failed to delete submission. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const getSubmissionStatus = () => {
    if (!assignmentData?.assignment) return "pending";
    return assignmentData.assignment.attachments &&
      assignmentData.assignment.attachments.length > 0
      ? "submitted"
      : "pending";
  };

  const getDueStatus = () => {
    if (!assignmentData?.assignment?.dueDate) return "no-due-date";

    const now = new Date();
    const due = new Date(assignmentData.assignment.dueDate);

    if (due < now) {
      return "overdue";
    }

    // Due in less than 24 hours
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 24) {
      return "due-soon";
    }

    return "upcoming";
  };

  const getTimeRemaining = () => {
    if (!assignmentData?.assignment?.dueDate) return null;

    const now = new Date();
    const due = new Date(assignmentData.assignment.dueDate);

    if (due < now) {
      return "Overdue";
    }

    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ${diffHours} hour${
        diffHours !== 1 ? "s" : ""
      } remaining`;
    }

    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} remaining`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to submit.",
        variant: "destructive",
      });
      return;
    }

    submitAssignment();
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    deleteSubmission();
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    toast({
      title: "Error loading assignment",
      description: "Could not load the assignment details. Please try again.",
      variant: "destructive",
    });
  }

  if (!assignmentData) {
    notFound();
  }

  const submissionStatus = getSubmissionStatus();
  const dueStatus = getDueStatus();
  const timeRemaining = getTimeRemaining();

  return (
    <div className="bg-gradient-to-b from-blue-50 via-blue-50/30 to-white px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-6">
          <motion.div
            whileHover={{ x: -3 }}
            whileTap={{ x: -6 }}
            className="inline-block"
          >
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center hover:bg-blue-50 text-black-700 hover:text-black-800"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Class
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="bg-white shadow-sm mb-6 border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 h-2"></div>
            <CardHeader className="pb-4">
              <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-black-900">
                  {assignmentData.title}
                </CardTitle>
                <Badge className="self-start bg-blue-700 hover:bg-blue-800">
                  Assignment
                </Badge>
              </div>
              <div className="flex items-center mt-2 text-black-600 text-sm">
                <Avatar className="mr-2 w-6 h-6">
                  <AvatarImage
                    src=""
                    alt={assignmentData.main_post.created_by}
                  />
                  <AvatarFallback className="bg-blue-700 text-white text-xs">
                    {assignmentData.main_post.created_by
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>Created by: {assignmentData.main_post.created_by}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold text-black-900 text-lg">
                    Description
                  </h3>
                  <p className="text-black-800 whitespace-pre-line">
                    {assignmentData.main_post.description}
                  </p>
                </div>

                {assignmentData.main_post.attachments &&
                  assignmentData.main_post.attachments.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-semibold text-black-900 text-lg">
                        Attachments
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {assignmentData.main_post.attachments.map(
                          (attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.filepath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 p-2 border border-blue-100 rounded-md text-black-700 transition-colors"
                            >
                              <FileIcon className="w-4 h-4 text-black-600" />
                              <span className="text-sm">
                                {attachment.filename}
                              </span>
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex sm:flex-row flex-col sm:items-center gap-4 bg-blue-50 p-4 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-black-700" />
                    <div>
                      <p className="font-medium text-black-600 text-sm">
                        Due Date
                      </p>
                      <p className="font-semibold text-black-900">
                        {formatDate(assignmentData.assignment.dueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-black-700" />
                    <div>
                      <p className="font-medium text-black-600 text-sm">
                        Total Marks
                      </p>
                      <p className="font-semibold text-black-900">
                        {assignmentData.assignment.totalMarks}
                      </p>
                    </div>
                  </div>

                  {timeRemaining && (
                    <div className="ml-auto">
                      {dueStatus === "overdue" ? (
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </Badge>
                      ) : dueStatus === "due-soon" ? (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600"
                        >
                          <Clock className="w-3 h-3" /> {timeRemaining}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 border-blue-200 text-black-700"
                        >
                          <Clock className="w-3 h-3" /> {timeRemaining}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-black-900 text-lg">
                    Submission Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {submissionStatus === "pending" ? (
                        <Badge
                          variant="outline"
                          className="border-blue-200 text-black-700"
                        >
                          Not Submitted
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3" /> Submitted
                        </Badge>
                      )}

                      {dueStatus === "overdue" &&
                        submissionStatus === "pending" && (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" /> Deadline
                            Passed
                          </Badge>
                        )}
                    </div>

                    <AnimatePresence>
                      {assignmentData.assignment.attachments &&
                        assignmentData.assignment.attachments.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 bg-blue-50 p-4 border border-blue-100 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-black-900">
                                Your Submission
                              </h4>
                              <p className="text-black-600 text-sm">
                                Submitted on:{" "}
                                {formatDate(
                                  assignmentData.assignment?.submittedOn
                                )}
                              </p>
                            </div>

                            {assignmentData.assignment.attachments?.length >
                              0 && (
                              <div>
                                <h4 className="mb-2 font-medium text-black-900">
                                  Submitted Files
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {assignmentData.assignment.attachments.map(
                                    (attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.filepath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-white hover:bg-blue-50 p-2 border border-blue-100 rounded-md text-black-700 transition-colors"
                                      >
                                        <FileIcon className="w-4 h-4 text-black-600" />
                                        <span className="text-sm">
                                          {attachment.filename}
                                        </span>
                                      </a>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="pt-2">
                              <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting || isSubmitting}
                                className="flex items-center gap-2"
                              >
                                {isDeleting ? (
                                  <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                Delete Submission
                              </Button>
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>

                    {assignmentData.assignment.marks !== undefined && (
                      <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg">
                        <h4 className="mb-2 font-medium text-black-900">
                          Grading
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Progress
                              value={
                                (assignmentData.assignment.marks /
                                  assignmentData.assignment.totalMarks) *
                                100
                              }
                              className="bg-blue-100 h-2.5"
                            />
                          </div>
                          <p className="font-semibold text-black-900">
                            {assignmentData.assignment.marks} /{" "}
                            {assignmentData.assignment.totalMarks}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {submissionStatus === "pending" && dueStatus !== "overdue" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Card className="bg-white shadow-sm border-blue-100 overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-black-900 text-lg">
                          Submit Assignment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor="file-upload"
                                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 border border-blue-200 rounded-md text-black-700 transition-colors cursor-pointer"
                              >
                                <FileUp className="w-4 h-4" />
                                <span>Select Files</span>
                              </label>
                              <input
                                id="file-upload"
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                              />
                            </div>

                            {uploadFiles.length > 0 && (
                              <div className="space-y-2 mt-4">
                                <p className="font-medium text-black-700 text-sm">
                                  Files to submit:
                                </p>
                                <div className="space-y-2">
                                  {uploadFiles.map((file, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="flex justify-between items-center bg-blue-50 p-2 border border-blue-100 rounded-md"
                                    >
                                      <div className="flex items-center gap-2 text-black-800">
                                        <FileUp className="w-4 h-4 text-black-600" />
                                        <span className="max-w-[200px] text-sm truncate">
                                          {file.name}
                                        </span>
                                        <span className="text-black-500 text-xs">
                                          ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFile(index)}
                                        className="hover:bg-blue-100 w-6 h-6 text-black-700 hover:text-black-900"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {isSubmitting && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-black-700 text-sm">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <Progress
                                value={uploadProgress}
                                className="bg-blue-100 h-2"
                              />
                            </div>
                          )}
                        </form>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-3 pt-4 border-t border-blue-50">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="submit"
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isSubmitting || uploadFiles.length === 0}
                          >
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                                <span>Submitting...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                <span>Submit Assignment</span>
                              </div>
                            )}
                          </Button>
                        </motion.div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AssignmentPage;
