"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
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

const Discussions = () => {
  const router = useRouter();
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const response = await fetch("/api/student/discussions");
        const data = await response.json();
        setDiscussions(data.threads);
      } catch (error) {
        console.error("Error fetching discussions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();
  }, []);

  const filterDiscussions = (category: string) => {
    if (category === "All") return discussions;
    return discussions.filter((d) => d.type === category);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl">Discussion Board</h2>
        <Button onClick={() => router.push("/student/discussions/create")}>
          <Plus className="mr-2 w-4 h-4" /> Create New Discussion
        </Button>
      </div>
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="all"
            className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
          >
            All Discussions
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="department"
            className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
          >
            Department
          </TabsTrigger>
          <TabsTrigger
            value="batch"
            className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
          >
            Batch
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-2 data-[state=active]:border-b-2 transition-all"
          >
            Custom Groups
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <DiscussionCard discussions={filterDiscussions("All")} />
        </TabsContent>
        <TabsContent value="general">
          <DiscussionCard discussions={filterDiscussions("General")} />
        </TabsContent>
        <TabsContent value="department">
          <DiscussionCard discussions={filterDiscussions("Department")} />
        </TabsContent>
        <TabsContent value="batch">
          <DiscussionCard discussions={filterDiscussions("Batch")} />
        </TabsContent>
        <TabsContent value="custom">
          <DiscussionCard discussions={filterDiscussions("Custom")} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DiscussionCard = ({ discussions }: { discussions: any[] }) => {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {discussions.map((discussion) => (
        <Card key={discussion.id}>
          <CardHeader>
            <CardTitle>{discussion.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{discussion.main_post.description}</p>
            <div className="flex items-center mt-4 text-gray-500 text-sm">
              <span>{discussion.main_post.created_by}</span>
              <span className="mx-2">•</span>
              <span>{discussion.reply_count} replies</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`${pathname}/${discussion.id}`}>
              <Button variant="default">View Full Discussion</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default Discussions;
