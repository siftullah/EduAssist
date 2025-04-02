"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/student/announcements");
        const data = await response.json();
        setAnnouncements(data.threads);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const filterAnnouncements = (category: string) => {
    if (category === "All") return announcements;
    return announcements.filter((d) => d.type === category);
  };

  if (loading) {
    return <div>Loading...</div>;
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

const AnnouncementCard = ({ announcements }: { announcements: any[] }) => {
  const pathname = usePathname();

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
