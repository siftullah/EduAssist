"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "lucide-react";

const ForumPage = ({ params }: { params: { forumId: string } }) => {
  const [forumData, setForumData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const isFacultyRoute = pathname.startsWith("/faculty");
  const basePath = isFacultyRoute
    ? "/faculty/discussions"
    : "/student/discussions";

  useEffect(() => {
    const fetchForumData = async () => {
      try {
        // Fetch forum threads
        const response = await fetch(`/api/student/forums/${params.forumId}`);
        const data = await response.json();
        setForumData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching forum data:", error);
        setLoading(false);
      }
    };

    fetchForumData();
  }, [params.forumId]);

  if (loading) {
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
          <CardTitle>{forumData?.forum_name || "Forum Threads"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forumData.threads.map((thread) => (
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
