"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare } from "lucide-react";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Loader from "./_components/Loader";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Discussion {
  id: string;
  title: string;
  type: string;
  main_post: {
    description: string;
    created_by: string;
    createdAt?: string;
  };
  reply_count: number;
}

interface DiscussionsResponse {
  threads: Discussion[];
}

// Axios function to fetch discussions
const fetchDiscussions = async (): Promise<DiscussionsResponse> => {
  try {
    const { data } = await axios.get("/api/student/discussions");
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch discussions"
      );
    }
    throw error;
  }
};

const Discussions = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch discussions using TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["studentDiscussions"],
    queryFn: fetchDiscussions,
  });

  const filterDiscussions = (category: string) => {
    if (!data?.threads) return [];
    if (category === "all") return data.threads;
    return data.threads.filter(
      (d) => d.type.toLowerCase() === category.toLowerCase()
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load discussions. Please try again.",
      variant: "destructive",
    });
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 via-blue-50/30 to-white px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center gap-2 font-bold text-gray-900 text-3xl"
            >
              <MessageSquare className="w-8 h-8 text-gray-700" />
              Discussion Board
            </motion.h1>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => router.push("/student/discussions/create")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 w-4 h-4" /> Create New Discussion
              </Button>
            </motion.div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Tabs
            defaultValue="all"
            className="relative mb-6"
            value={activeTab}
            onValueChange={setActiveTab}
            style={{ position: "relative", zIndex: 1 }}
          >
            <TabsList className="relative bg-blue-50/70 shadow-sm p-1 border border-blue-100 rounded-lg overflow-hidden">
              <TabsTrigger
                value="all"
                className="group z-10 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:shadow-sm px-4 py-2 rounded-md text-black-700 data-[state=active]:hover:text-white data-[state=active]:text-white hover:text-blue-600 capitalize transition-all"
              >
                All Discussions
              </TabsTrigger>
              <TabsTrigger
                value="general"
                className="group z-10 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:shadow-sm px-4 py-2 rounded-md text-black-700 data-[state=active]:hover:text-white data-[state=active]:text-white hover:text-blue-600 capitalize transition-all"
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="department"
                className="group z-10 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:shadow-sm px-4 py-2 rounded-md text-black-700 data-[state=active]:hover:text-white data-[state=active]:text-white hover:text-blue-600 capitalize transition-all"
              >
                Department
              </TabsTrigger>
              <TabsTrigger
                value="batch"
                className="group z-10 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:shadow-sm px-4 py-2 rounded-md text-black-700 data-[state=active]:hover:text-white data-[state=active]:text-white hover:text-blue-600 capitalize transition-all"
              >
                Batch
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="group z-10 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:shadow-sm px-4 py-2 rounded-md text-black-700 data-[state=active]:hover:text-white data-[state=active]:text-white hover:text-blue-600 capitalize transition-all"
              >
                Custom Groups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DiscussionCard discussions={filterDiscussions("all")} />
            </TabsContent>
            <TabsContent value="general">
              <DiscussionCard discussions={filterDiscussions("general")} />
            </TabsContent>
            <TabsContent value="department">
              <DiscussionCard discussions={filterDiscussions("department")} />
            </TabsContent>
            <TabsContent value="batch">
              <DiscussionCard discussions={filterDiscussions("batch")} />
            </TabsContent>
            <TabsContent value="custom">
              <DiscussionCard discussions={filterDiscussions("custom")} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

const DiscussionCard = ({ discussions }: { discussions: Discussion[] }) => {
  const pathname = usePathname();

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
      });
    }
  };

  if (discussions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 p-6 border border-blue-100 rounded-lg text-center"
      >
        <p className="text-gray-700">No discussions found in this category.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {discussions.map((discussion) => (
          <motion.div key={discussion.id} variants={itemVariants}>
            <Link href={`${pathname}/${discussion.id}`}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="bg-white shadow-sm hover:shadow-md border-blue-100 overflow-hidden transition-all">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-1"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-gray-900">
                        {discussion.title}
                      </CardTitle>
                      <Badge
                        className={`
                        ${
                          discussion.type.toLowerCase() === "general"
                            ? "bg-blue-600"
                            : ""
                        }
                        ${
                          discussion.type.toLowerCase() === "department"
                            ? "bg-green-600"
                            : ""
                        }
                        ${
                          discussion.type.toLowerCase() === "batch"
                            ? "bg-amber-600"
                            : ""
                        }
                        ${
                          discussion.type.toLowerCase() === "custom"
                            ? "bg-purple-600"
                            : ""
                        }
                        hover:opacity-90
                      `}
                      >
                        {discussion.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-700 line-clamp-2">
                      {discussion.main_post.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src=""
                            alt={discussion.main_post.created_by}
                          />
                          <AvatarFallback className="bg-blue-200 text-gray-700 text-xs">
                            {discussion.main_post.created_by
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-600 text-sm">
                          {discussion.main_post.created_by}
                        </span>
                        {discussion.main_post.createdAt && (
                          <>
                            <span className="mx-1 text-gray-400">•</span>
                            <span className="text-gray-500 text-sm">
                              {formatDate(discussion.main_post.createdAt)}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <MessageSquare className="mr-1 w-4 h-4" />
                        <span>
                          {discussion.reply_count}{" "}
                          {discussion.reply_count === 1 ? "reply" : "replies"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t border-blue-50">
                    <Button
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      View Full Discussion
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default Discussions;
