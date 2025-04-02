"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftIcon, FileIcon } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

interface Discussion {
  id: string;
  title: string;
  main_post: Post;
  replies?: Post[];
}

interface Post {
  id: string;
  description: string;
  created_by: string;
  attachments?: {
    id: string;
    filename: string;
    filepath: string;
  }[];
}

const fetchDiscussion = async (id: string): Promise<Discussion> => {
  const { data } = await axios.get(`/api/faculty/discussions/${id}`);
  return data;
};

const postReply = async ({
  discussionId,
  reply,
}: {
  discussionId: string;
  reply: string;
}) => {
  const { data } = await axios.post(
    `/api/faculty/discussions/${discussionId}/post-reply`,
    {
      reply,
    }
  );
  return data;
};

const DiscussionPage = ({ params }: { params: { discussionID: string } }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const { data: discussion, isLoading } = useQuery({
    queryKey: ["discussion", params.discussionID],
    queryFn: () => fetchDiscussion(params.discussionID),
  });

  const mutation = useMutation({
    mutationFn: () => postReply({ discussionId: params.discussionID, reply }),
    onSuccess: () => {
      setReply("");
      toast.success("Reply posted successfully!");
      queryClient.invalidateQueries({
        queryKey: ["discussion", params.discussionID],
      });
    },
    onError: () => {
      toast.error("Failed to post reply. Please try again.");
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!discussion) {
    return null;
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <Button onClick={() => router.back()} className="flex items-center mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{discussion.title}</CardTitle>
          <div className="flex items-center text-gray-500 text-sm">
            <span>{discussion.main_post.created_by}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{discussion.main_post.description}</p>
          <div className="flex items-center gap-4">
            {discussion.main_post.attachments?.map((attachment) => (
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
            {discussion.replies?.map((reply) => (
              <Card key={reply.id}>
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
            ))}
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
              {mutation.isPending ? "Posting..." : "Post Reply"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscussionPage;
