import React from "react";
import { ClassroomThread } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { assignments, classroomPosts, submissions } from "@/data/mockData";

interface AssignmentCardProps {
  assignmentThreads: ClassroomThread[];
  studentId?: string;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignmentThreads,
  studentId,
}) => {
  const pathname = usePathname();
  const isFacultyRoute = pathname.startsWith("/faculty");
  const basePath = isFacultyRoute
    ? "/faculty/assignments"
    : "/student/assignments";

  const getSubmissionStatus = (assignmentId?: string) => {
    if (!studentId || !assignmentId) return null;

    const submission = submissions.find(
      (s) => s.assignment_id === assignmentId && s.student_id === studentId
    );

    if (!submission) return "pending";
    if (submission.marks !== undefined) return "marked";
    return "submitted";
  };

  const renderStatusBadge = (
    status: string | null,
    marks?: number,
    totalMarks?: number
  ) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "submitted":
        return <Badge variant="default">Submitted</Badge>;
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
      {assignmentThreads.map((thread) => {
        const mainPost = classroomPosts.find(
          (post) => post.id === thread.main_post_id
        );
        const assignmentDetails = assignments.find(
          (assignment) => assignment.thread_id === thread.id
        );

        const submission = studentId
          ? submissions.find(
              (s) =>
                s.assignment_id === assignmentDetails?.id &&
                s.student_id === studentId
            )
          : null;
        const status = getSubmissionStatus(assignmentDetails?.id);
        return (
          <Card key={thread.id} className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{thread.title}</CardTitle>
                {renderStatusBadge(
                  status,
                  submission?.marks,
                  assignmentDetails?.total_marks
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-gray-600">{mainPost?.description}</p>
              <div className="flex items-center text-gray-500 text-sm">
                <span>
                  Due: {assignmentDetails?.due_date.toLocaleDateString()}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`${basePath}/${thread.id}`}>
                <Button variant="default">
                  {isFacultyRoute ? "View Submissions" : "View Assignment"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default AssignmentCard;
