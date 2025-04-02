"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Forum } from "@/app/types/forum";

const fetchForumData = async (forumId: string): Promise<Forum> => {
  const { data } = await axios.get(`/api/faculty/forums/${forumId}`);
  return data;
};

const ForumPage = ({ params }: { params: { forumId: string } }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isFacultyRoute = pathname.startsWith("/faculty");
  const basePath = isFacultyRoute
    ? "/faculty/discussions"
    : "/student/discussions";

  const { data, isLoading } = useQuery({
    queryKey: ["forum", params.forumId],
    queryFn: () => fetchForumData(params.forumId),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="px-4 sm:px-0 py-6">
      <Button onClick={() => router.back()} className="flex items-center mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{data?.forum_name || "Forum Threads"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.threads?.map((thread) => (
              <Link key={thread.id} href={`${basePath}/${thread.id}`}>
                <Card>
                  <CardContent className="flex justify-between items-center py-4">
                    <div>
                      <h4 className="font-semibold">{thread.title}</h4>
                      <p className="text-gray-500 text-sm">
                        Started by {thread.author} - {formatDate(thread.date)}
                      </p>
                    </div>
                    <Badge>{thread.replies} replies</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumPage;
