"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Class {
  id: string;
  name: string;
  course: Course;
}

interface Assignment {
  id: string;
  thread_id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  submissionCount: number;
  classroom: {
    id: string;
    name: string;
    course: Course;
  };
}

interface AssignmentsResponse {
  classes: Class[];
  assignments: Assignment[];
}

const fetchAssignments = async (): Promise<AssignmentsResponse> => {
  const { data } = await axios.get("/api/faculty/assignments");
  return data;
};

const AssignmentsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialClassId = searchParams.get("classId") || "all";
  const [filter, setFilter] = useState(initialClassId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Error loading assignments. Please try again later.</p>
      </div>
    );
  }

  if (!data) return null;

  const { classes, assignments } = data;
  const filteredAssignments = assignments.filter((assignment: Assignment) =>
    filter === "all" ? true : assignment.classroom.id === filter
  );

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Assignment Details</CardTitle>
        <Select value={filter} onValueChange={(value) => setFilter(value)}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {classes.map((cls: Class) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.course.code} - {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filteredAssignments.length === 0 ? (
          <div className="py-8 text-gray-500 text-center">
            No assignments found for this filter.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Classroom</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment: Assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">
                    {assignment.title}
                  </TableCell>
                  <TableCell>
                    {assignment.classroom.course.code} -{" "}
                    {assignment.classroom.course.name}
                  </TableCell>
                  <TableCell>{assignment.classroom.name}</TableCell>
                  <TableCell>
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{assignment.totalMarks}</TableCell>
                  <TableCell>{assignment.submissionCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        router.push(`/faculty/assignments/${assignment.id}`)
                      }
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

const Assignments = () => {
  const router = useRouter();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-semibold text-3xl">Assignments</h1>

        <Button onClick={() => router.push("/faculty/assignments/create")}>
          <Plus className="mr-2 w-4 h-4" />
          Create New Assignment
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }
      >
        <AssignmentsContent />
      </Suspense>
    </>
  );
};

export default Assignments;
