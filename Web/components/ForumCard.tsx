import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Forum } from "@/app/types/forum";

const ForumCard = ({ forums }: { forums: Forum[] }) => {
  const pathname = usePathname();
  const isFacultyRoute = pathname.startsWith("/faculty");
  const basePath = isFacultyRoute ? "/faculty/forums" : "/student/forums";

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
    <div className="space-y-4">
      {forums.map((forum) => (
        <Card key={forum.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{forum.title}</CardTitle>
              <Badge variant="secondary">{forum.group_name}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-gray-500 text-sm">
              <div className="flex gap-2">
                <Badge variant="outline" className="border-gray-400 px-4 py-2">
                  {forum.thread_count} threads
                </Badge>
              </div>
              <div className="text-right">
                <p className="font-semibold">Last activity</p>
                <p>{formatDate(forum.last_activity)}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`${basePath}/${forum.id}`}>
              <Button variant="default">View Forum</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ForumCard;
