import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Paperclip } from "lucide-react";

interface Assignment {
  id: string;
  dueDate: string;
  totalMarks: number;
  submissionCount: number;
  pendingGrading: number;
}

interface Discussion {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  author: string;
  assignment: Assignment | null;
  attachments: {
    id: string;
    filename: string;
    filepath: string;
  }[];
}

const AssignmentCard = ({ assignments }: { assignments: Discussion[] }) => {
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
      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>{assignment.title}</CardTitle>
              {assignment.assignment && (
                <Badge variant="secondary">
                  Due: {formatDate(assignment.assignment.dueDate)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{assignment.description}</p>
            <div className="flex items-center mt-4 text-gray-500 text-sm">
              <Calendar className="mr-2 w-4 h-4" />
              <span>{formatDate(assignment.createdAt)}</span>
              <span className="mx-2">•</span>
              <span>By: {assignment.author}</span>
              {assignment.attachments.length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <Paperclip className="mr-1 w-4 h-4" />
                  <span>{assignment.attachments.length} attachments</span>
                </>
              )}
            </div>
            {assignment.assignment && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline">
                  {assignment.assignment.totalMarks} marks
                </Badge>
                <Badge variant="outline">
                  {assignment.assignment.submissionCount} submissions
                </Badge>
                {assignment.assignment.pendingGrading > 0 && (
                  <Badge variant="destructive">
                    {assignment.assignment.pendingGrading} pending
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href={`/faculty/assignments/${assignment.assignment?.id}`}>
              <Button variant="default">View Assignment</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AssignmentCard;
