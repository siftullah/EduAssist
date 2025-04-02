import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Thread } from "@/app/types/classroom";
import { usePathname } from "next/navigation";

const AssignmentCard = ({ assignments }: { assignments: Thread[] }) => {
  const pathname = usePathname();
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const getSubmissionStatus = (assignmentId: string) => {
    const marks = assignments.find((a) => a.id === assignmentId)?.assignment
      ?.marks;
    if (!marks) return "pending";
    return "submitted";
  };

  const renderStatusBadge = (
    status: string | null,
    totalMarks?: number,
    marks?: number
  ) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Total Marks: {totalMarks}</Badge>;
      case "marked":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Marked - {marks} / {totalMarks}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {assignments.map((thread) => {
        const status = getSubmissionStatus(thread.id);
        return (
          <Card key={thread.id} className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{thread.title}</CardTitle>
                {renderStatusBadge(
                  status,
                  thread?.assignment?.totalMarks,
                  thread?.assignment?.marks
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-gray-600">
                {thread.main_post.description}
              </p>
              <div className="flex items-center text-gray-500 text-sm">
                <span>Due: {formatDate(thread?.assignment?.dueDate)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`${pathname}/assignment/${thread.id}`}>
                <Button variant="default">View Assignment</Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default AssignmentCard;
