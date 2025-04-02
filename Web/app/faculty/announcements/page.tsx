"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";

// Define TypeScript interfaces
interface Announcement {
  id: string;
  title: string;
  type: string;
  main_post: {
    description: string;
    created_by: string;
  };
  reply_count: number;
}

interface AnnouncementsResponse {
  threads: Announcement[];
}

// API fetch function
const fetchAnnouncements = async (): Promise<Announcement[]> => {
  const { data } = await axios.get<AnnouncementsResponse>(
    "/api/faculty/announcements"
  );
  return data.threads;
};

const Announcements = () => {
  // Use TanStack Query to fetch announcements
  const {
    data: announcements,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  const filterAnnouncements = (category: string) => {
    if (!announcements) return [];
    if (category === "All") return announcements;
    return announcements.filter((d) => d.type === category);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500">
        Error loading announcements. Please try again later.
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl">Announcement Board</h2>
      </div>
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-primary data-[state=active]:border-b-2 transition-all"
          >
            All Annoucements
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-primary data-[state=active]:border-b-2 transition-all"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="department"
            className="data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-primary data-[state=active]:border-b-2 transition-all"
          >
            Department
          </TabsTrigger>
          <TabsTrigger
            value="batch"
            className="data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-primary data-[state=active]:border-b-2 transition-all"
          >
            Batch
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <AnnouncementCard announcements={filterAnnouncements("All")} />
        </TabsContent>
        <TabsContent value="general">
          <AnnouncementCard announcements={filterAnnouncements("General")} />
        </TabsContent>
        <TabsContent value="department">
          <AnnouncementCard announcements={filterAnnouncements("Department")} />
        </TabsContent>
        <TabsContent value="batch">
          <AnnouncementCard announcements={filterAnnouncements("Batch")} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AnnouncementCard = ({
  announcements,
}: {
  announcements: Announcement[];
}) => {
  const pathname = usePathname();

  if (announcements.length === 0) {
    return <div className="p-4 text-gray-500">No announcements found</div>;
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Link key={announcement.id} href={`${pathname}/${announcement.id}`}>
          <Card>
            <CardHeader>
              <CardTitle>{announcement.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {announcement.main_post.description}
              </p>
              <div className="flex items-center mt-4 text-gray-500 text-sm">
                <span>{announcement.main_post.created_by}</span>
                <span className="mx-2">•</span>
                <span>{announcement.reply_count} replies</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default Announcements;
