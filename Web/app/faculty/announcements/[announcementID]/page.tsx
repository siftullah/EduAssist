"use client";

import React, { useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftIcon, FileIcon, Loader2 } from "lucide-react";
import Loader from "./_components/Loader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Announcement {
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
  attachments?: Attachment[];
}

interface ReplyData {
  reply: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

interface ReplyResponse {
  success: boolean;
  message: string;
}

// API fetch function
const fetchAnnouncementDetails = async (
  announcementId: string
): Promise<Announcement> => {
  const { data } = await axios.get<Announcement>(
    `/api/faculty/announcements/${announcementId}`
  );
  return data;
};

// API mutation function
const postReply = async (
  announcementId: string,
  replyData: ReplyData
): Promise<ReplyResponse> => {
  const { data } = await axios.post<ReplyResponse>(
    `/api/faculty/announcements/${announcementId}/post-reply`,
    replyData
  );
  return data;
};

const AnnouncementPage = ({
  params,
}: {
  params: { announcementID: string };
}) => {
  const [reply, setReply] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch announcement data
  const {
    data: announcementData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["announcement", params.announcementID],
    queryFn: () => fetchAnnouncementDetails(params.announcementID),
  });

  // Mutation for posting replies
  const mutation = useMutation({
    mutationFn: (replyText: string) =>
      postReply(params.announcementID, { reply: replyText }),
    onSuccess: () => {
      setReply("");
      toast.success("Reply posted successfully!");
      // Refresh announcement data
      queryClient.invalidateQueries({
        queryKey: ["announcement", params.announcementID],
      });
    },
    onError: (error: unknown) => {
      console.error("Failed to post reply:", error);
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.error ||
          apiError.message ||
          "An error occurred while posting your reply."
      );
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(reply);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !announcementData) {
    notFound();
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <ToastContainer />
      <Button onClick={() => router.back()} className="flex items-center mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{announcementData.title}</CardTitle>
          <div className="flex items-center text-gray-500 text-sm">
            <span>{announcementData.main_post.created_by}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{announcementData.main_post.description}</p>
          <div className="flex items-center gap-4">
            {announcementData.main_post.attachments &&
              announcementData.main_post.attachments.map((attachment) => (
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
          </div>
          <div className="space-y-4">
            {announcementData.replies?.map((reply, index) => {
              return (
                <Card key={index}>
                  <CardContent className="flex items-start space-x-4 pt-4">
                    <Avatar>
                      <AvatarImage
                        src="/placeholder-user.jpg"
                        alt={reply.created_by}
                      />
                      <AvatarFallback>
                        {reply.created_by[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{reply.created_by}</h4>
                      </div>
                      <p className="mt-1">{reply.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <form onSubmit={handleSubmit} className="mt-6">
            <Textarea
              placeholder="Write your reply..."
              className="mb-2"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              required
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              )}
              {mutation.isPending ? "Posting..." : "Post Reply"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementPage;
