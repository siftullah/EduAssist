"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "./_components/Loader";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Thread {
  id: string;
  title: string;
  author: string;
  date: string;
  replies: number;
}

interface ForumData {
  forum_name: string;
  threads: Thread[];
}

// Axios function to fetch forum data
const fetchForumData = async (forumId: string): Promise<ForumData> => {
  const { data } = await axios.get(`/api/student/forums/${forumId}`);
  return data;
};

const ForumPage = ({ params }: { params: { forumId: string } }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isFacultyRoute = pathname.startsWith("/faculty");
  const basePath = isFacultyRoute
    ? "/faculty/discussions"
    : "/student/discussions";

  // Fetch forum data using React Query
  const {
    data: forumData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["forumData", params.forumId],
    queryFn: () => fetchForumData(params.forumId),
  });

  // Show error toast if there's an error fetching data
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading forum",
        description: "Could not load the forum data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  if (isLoading) {
    return <Loader />;
  }

  if (!forumData) {
    return (
      <div className="bg-gradient-to-b from-blue-50 via-blue-50/30 to-white px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="mx-auto max-w-7xl">
          <div className="bg-blue-50 p-6 border border-blue-100 rounded-lg text-center">
            <p className="text-gray-700">
              Forum not found or error loading forum data.
            </p>
            <Button
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
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
      });
    }
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
        className="mx-auto max-w-7xl"
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
              className="flex items-center hover:bg-blue-50 text-gray-700 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Forums
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
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-gray-600" />
                <CardTitle className="text-gray-900">
                  {forumData.forum_name || "Forum Threads"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {forumData.threads.length === 0 ? (
                  <div className="bg-blue-50 p-6 border border-blue-100 rounded-lg text-center">
                    <p className="text-gray-700">
                      No threads found in this forum.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {forumData.threads.map((thread) => (
                      <motion.div key={thread.id} variants={itemVariants}>
                        <Link href={`${basePath}/${thread.id}`}>
                          <motion.div
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="bg-white shadow-sm hover:shadow-md border-blue-100 overflow-hidden transition-all">
                              <CardContent className="flex justify-between items-center py-4">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {thread.title}
                                  </h4>
                                  <p className="text-gray-600 text-sm">
                                    Started by {thread.author} -{" "}
                                    {formatDate(thread.date)}
                                  </p>
                                </div>
                                <Badge className="bg-blue-600 hover:bg-blue-700">
                                  {thread.replies}{" "}
                                  {thread.replies === 1 ? "reply" : "replies"}
                                </Badge>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForumPage;
