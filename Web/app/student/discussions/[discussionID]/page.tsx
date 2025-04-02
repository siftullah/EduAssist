"use client";

import React, { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftIcon, FileIcon } from "lucide-react";
import Loader from "./_components/Loader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Discussion {
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

const DiscussionPage = ({ params }: { params: { discussionID: string } }) => {
  const [discussionData, setDiscussionData] = useState<Discussion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchDiscussionDetails = async () => {
      try {
        const response = await fetch(
          `/api/student/discussions/${params.discussionID}`
        );
        const data = await response.json();
        setDiscussionData(data);
      } catch (error) {
        console.error("Failed to fetch discussion details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscussionDetails();
  }, [params.discussionID]);

  if (isLoading) {
    return <Loader />;
  }

  if (!discussionData) {
    notFound();
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch(
        `/api/student/discussions/${params.discussionID}/post-reply`,
        {
          method: "POST",
          body: JSON.stringify({ reply }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setReply("");
        toast.success("Reply posted successfully!");
        // Fetch updated discussion data
        const updatedDiscussion = await fetch(
          `/api/student/discussions/${params.discussionID}`
        );
        const data = await updatedDiscussion.json();
        setDiscussionData(data);
      } else {
        toast.error("Failed to post reply. Please try again.");
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
      toast.error("An error occurred while posting your reply.");
    }
  };

  return (
    <div className="px-4 sm:px-0 py-6">
      <ToastContainer />
      <Button onClick={() => router.back()} className="flex items-center mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{discussionData.title}</CardTitle>
          <div className="flex items-center text-gray-500 text-sm">
            <span>{discussionData.main_post.created_by}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{discussionData.main_post.description}</p>
          <div className="flex items-center gap-4">
            {discussionData.main_post.attachments &&
              discussionData.main_post.attachments.map((attachment) => (
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
            {discussionData.replies?.map((reply, index) => {
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
            <Button type="submit">Post Reply</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscussionPage;
