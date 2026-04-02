"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftIcon,
  FileIcon,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Loader from "./_components/Loader";

interface Attachment {
  id: string;
  filename: string;
  filepath: string;
}

interface Post {
  id: string;
  description: string;
  createdAt: string;
  author: string;
  attachments: Attachment[];
}

interface Assignment {
  id: string;
  dueDate: string;
  totalMarks: number;
  submissionCount: number;
  pendingGrading: number;
}

interface Thread {
  id: string;
  title: string;
  type: "announcement" | "discussion" | "assignment";
  mainPost: Post;
  replies: Post[];
  assignment: Assignment | null;
}

const fetchThread = async (
  classId: string,
  threadId: string
): Promise<Thread> => {
  const { data } = await axios.get(
    `/api/faculty/classes/${classId}/${threadId}`
  );
  return data;
};

const postReply = async ({
  classId,
  threadId,
  reply,
}: {
  classId: string;
  threadId: string;
  reply: string;
}) => {
  const { data } = await axios.post(
    `/api/faculty/classes/${classId}/${threadId}/post-reply`,
    { reply }
  );
  return data;
};

const ThreadPage = ({
  params,
}: {
  params: { classID: string; threadID: string };
}) => {
  const [reply, setReply] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", params.classID, params.threadID],
    queryFn: () => fetchThread(params.classID, params.threadID),
  });

  const mutation = useMutation({
    mutationFn: () =>
      postReply({ classId: params.classID, threadId: params.threadID, reply }),
    onSuccess: () => {
      setReply("");
      toast.success("Reply posted successfully");
      queryClient.invalidateQueries({
        queryKey: ["thread", params.classID, params.threadID],
      });
    },
    onError: (error) => {
      console.error("Error:", error);
      toast.error("Failed to post reply");
    },
  });

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!thread) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="px-4 sm:px-0 py-6">
      <Button onClick={() => router.back()} variant="ghost" className="mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{thread.title}</CardTitle>
              <p className="mt-1 text-gray-500 text-sm">
                Posted by {thread.mainPost.author} on{" "}
                {formatDate(thread.mainPost.createdAt)}
              </p>
            </div>
            <Badge
              variant={thread.type === "assignment" ? "destructive" : "default"}
            >
              {thread.type.charAt(0).toUpperCase() + thread.type.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>{thread.mainPost.description}</p>

            {thread.mainPost.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {thread.mainPost.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.filepath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 p-2 rounded-md"
                  >
                    <FileIcon className="w-4 h-4" />
                    <span>{attachment.filename}</span>
                  </a>
                ))}
              </div>
            )}

            {thread.assignment && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Due: {formatDate(thread.assignment.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span>
                        {thread.assignment.submissionCount} Submissions
                      </span>
                    </div>
                    {thread.assignment.pendingGrading > 0 && (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>{thread.assignment.pendingGrading} Pending</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4 mt-8">
              <h3 className="font-semibold">Replies</h3>
              {thread.replies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="pt-4">
                    <div className="flex gap-4">
                      <Avatar>
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback>
                          {reply.author[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-semibold">{reply.author}</p>
                          <span className="text-gray-500 text-sm">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2">{reply.description}</p>
                        {reply.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {reply.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.filepath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 p-2 rounded-md"
                              >
                                <FileIcon className="w-4 h-4" />
                                <span>{attachment.filename}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <form onSubmit={handleSubmitReply}>
                <Textarea
                  placeholder="Write your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="mb-2"
                  required
                />
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Posting..." : "Post Reply"}
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreadPage;
