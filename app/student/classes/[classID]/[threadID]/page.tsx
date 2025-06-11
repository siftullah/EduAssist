"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  FileIcon,
  MessageSquare,
  Paperclip,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import Loader from "./_components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Thread {
  id: string;
  title: string;
  main_post: Post;
  replies?: Post[];
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
  createdAt?: string;
  attachments?: Attachment[];
}

interface ReplyPayload {
  reply: string;
}

// Axios function to fetch thread details
const fetchThreadDetails = async (
  classId: string,
  threadId: string
): Promise<Thread> => {
  try {
    const { data } = await axios.get(
      `/api/student/classes/${classId}/${threadId}`
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch thread details"
      );
    }
    throw error;
  }
};

// Axios function to post a reply
const postReply = async (
  classId: string,
  threadId: string,
  payload: ReplyPayload
) => {
  try {
    const { data } = await axios.post(
      `/api/student/classes/${classId}/${threadId}/post-reply`,
      payload
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Failed to post reply");
    }
    throw error;
  }
};

const ThreadPage = ({
  params,
}: {
  params: { threadID: string; classID: string };
}) => {
  const [reply, setReply] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query hook for fetching thread details
  const {
    data: threadData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["threadDetails", params.classID, params.threadID],
    queryFn: () => fetchThreadDetails(params.classID, params.threadID),
  });

  // Mutation hook for posting a reply
  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: (replyText: string) =>
      postReply(params.classID, params.threadID, { reply: replyText }),
    onSuccess: () => {
      setReply("");
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      });
      // Invalidate and refetch thread data
      queryClient.invalidateQueries({
        queryKey: ["threadDetails", params.classID, params.threadID],
      });
    },
    onError: (error) => {
      console.error("Failed to post reply:", error);
      toast({
        title: "Error",
        description: "An error occurred while posting your reply.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading thread",
        description: "Could not load the discussion thread. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  if (isLoading) {
    return <Loader />;
  }

  if (!threadData) {
    notFound();
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return diffInHours === 0
        ? "Just now"
        : `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reply.trim()) {
      toast({
        title: "Empty reply",
        description: "Please write something before posting.",
        variant: "destructive",
      });
      return;
    }

    mutate(reply);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

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
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-2"></div>
            <CardHeader className="pb-4">
              <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-black-900">
                  {threadData.title}
                </CardTitle>
                <Badge className="self-start bg-blue-600 hover:bg-blue-700">
                  Discussion Thread
                </Badge>
              </div>
              <div className="flex items-center mt-2 text-black-600 text-sm">
                <Avatar className="mr-2 w-6 h-6">
                  <AvatarImage src={""} alt={threadData.main_post.created_by} />
                  <AvatarFallback className="bg-blue-700 text-white text-xs">
                    {threadData.main_post.created_by.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{threadData.main_post.created_by}</span>
                {threadData.main_post.createdAt && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{formatDate(threadData.main_post.createdAt)}</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-black-800 whitespace-pre-line">
                {threadData.main_post.description}
              </p>

              {threadData.main_post.attachments &&
                threadData.main_post.attachments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-2 font-medium text-black-700 text-sm">
                      Attachments:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {threadData.main_post.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.filepath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 p-2 border border-blue-100 rounded-md text-black-700 transition-colors"
                        >
                          <FileIcon className="w-4 h-4 text-black-600" />
                          <span className="text-sm">{attachment.filename}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <h3 className="flex items-center gap-2 mb-4 font-semibold text-black-900 text-lg">
            <MessageSquare className="w-5 h-5 text-black-700" />
            Replies ({threadData.replies?.length || 0})
          </h3>

          <AnimatePresence>
            {!threadData.replies || threadData.replies.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="bg-blue-50 mb-6 p-6 border border-blue-100 rounded-lg text-center"
              >
                <p className="text-black-700">
                  No replies yet. Be the first to respond!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {threadData.replies.map((reply, index) => (
                  <motion.div key={reply.id || index} variants={itemVariants}>
                    <Card className="bg-white shadow-sm hover:shadow-md border-blue-100 overflow-hidden transition-all">
                      <CardContent className="flex items-start gap-4 pt-4">
                        <Avatar>
                          <AvatarImage src={""} alt={reply.created_by} />
                          <AvatarFallback className="bg-blue-700 text-white">
                            {reply.created_by.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-black-900">
                              {reply.created_by}
                            </h4>
                            {reply.createdAt && (
                              <span className="text-black-500 text-sm">
                                {formatDate(reply.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-black-800 whitespace-pre-line">
                            {reply.description}
                          </p>

                          {reply.attachments &&
                            reply.attachments.length > 0 && (
                              <div className="mt-4">
                                <h5 className="mb-2 font-medium text-black-700 text-sm">
                                  Attachments:
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {reply.attachments.map((attachment) => (
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
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="bg-white shadow-sm border-blue-100 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-black-900 text-lg">
                Post a Reply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="Write your reply..."
                  className="border-blue-200 focus:ring-blue-500 min-h-[120px]"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  required
                />

                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="hover:bg-blue-50 border-blue-200 text-black-700"
                  >
                    <Paperclip className="mr-2 w-4 h-4" />
                    Attach Files
                  </Button>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                          <span>Posting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          <span>Post Reply</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ThreadPage;
