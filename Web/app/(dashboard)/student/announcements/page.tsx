"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import Loader from "./_components/Loader";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Announcement {
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

interface AnnouncementsResponse {
  threads: Announcement[];
}

// Axios function to fetch announcements
const fetchAnnouncements = async (): Promise<AnnouncementsResponse> => {
  try {
    const { data } = await axios.get("/api/student/announcements");
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch announcements"
      );
    }
    throw error;
  }
};

const Announcements = () => {
  const [activeTab, setActiveTab] = useState("all");

  // Fetch announcements using TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["studentAnnouncements"],
    queryFn: fetchAnnouncements,
  });

  const filterAnnouncements = (category: string) => {
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
      description: "Failed to load announcements. Please try again.",
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
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-2 mb-4 font-bold text-gray-900 text-3xl"
          >
            <Bell className="w-8 h-8 text-gray-700" />
            Announcement Board
          </motion.h1>
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
          >
            <TabsList className="relative bg-blue-50/70 shadow-sm p-1 border border-blue-100 rounded-lg overflow-hidden">
              <TabsTrigger
                value="all"
                className="group z-10 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:shadow-sm px-4 py-2 rounded-md text-black-700 data-[state=active]:hover:text-white data-[state=active]:text-white hover:text-blue-600 capitalize transition-all"
              >
                All Announcements
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
            </TabsList>

            <TabsContent value="all">
              <AnnouncementCard announcements={filterAnnouncements("all")} />
            </TabsContent>
            <TabsContent value="general">
              <AnnouncementCard
                announcements={filterAnnouncements("general")}
              />
            </TabsContent>
            <TabsContent value="department">
              <AnnouncementCard
                announcements={filterAnnouncements("department")}
              />
            </TabsContent>
            <TabsContent value="batch">
              <AnnouncementCard announcements={filterAnnouncements("batch")} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

const AnnouncementCard = ({
  announcements,
}: {
  announcements: Announcement[];
}) => {
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

  if (announcements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 p-6 border border-blue-100 rounded-lg text-center"
      >
        <p className="text-gray-700">
          No announcements found in this category.
        </p>
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
        {announcements.map((announcement) => (
          <motion.div key={announcement.id} variants={itemVariants}>
            <Link href={`${pathname}/${announcement.id}`}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="bg-white shadow-sm hover:shadow-md border-blue-100 overflow-hidden transition-all">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-1"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <CardTitle className="text-gray-900">
                          {announcement.title}
                        </CardTitle>
                      </div>
                      <Badge
                        className={`
                        ${
                          announcement.type.toLowerCase() === "general"
                            ? "bg-blue-600"
                            : ""
                        }
                        ${
                          announcement.type.toLowerCase() === "department"
                            ? "bg-green-600"
                            : ""
                        }
                        ${
                          announcement.type.toLowerCase() === "batch"
                            ? "bg-amber-600"
                            : ""
                        }
                        hover:opacity-90
                      `}
                      >
                        {announcement.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-700 line-clamp-2">
                      {announcement.main_post.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src=""
                            alt={announcement.main_post.created_by}
                          />
                          <AvatarFallback className="bg-blue-200 text-gray-700 text-xs">
                            {announcement.main_post.created_by
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-600 text-sm">
                          {announcement.main_post.created_by}
                        </span>
                        {announcement.main_post.createdAt && (
                          <>
                            <span className="mx-1 text-gray-400">•</span>
                            <span className="text-gray-500 text-sm">
                              {formatDate(announcement.main_post.createdAt)}
                            </span>
                          </>
                        )}
                      </div>
                      {announcement.reply_count > 0 && (
                        <div className="text-gray-500 text-sm">
                          <span>
                            {announcement.reply_count}{" "}
                            {announcement.reply_count === 1
                              ? "reply"
                              : "replies"}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default Announcements;
