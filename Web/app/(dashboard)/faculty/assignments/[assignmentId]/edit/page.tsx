"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon, Loader2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Class {
  id: string;
  name: string;
  course: {
    id: string;
    name: string;
    code: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  classroom: {
    id: string;
    name: string;
    course: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface AssignmentFormData {
  title: string;
  description: string;
  dueDate: string;
  totalMarks: string;
  classroomId: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

const fetchAssignment = async (assignmentId: string): Promise<Assignment> => {
  const { data } = await axios.get(`/api/faculty/assignments/${assignmentId}`);
  return data;
};

const fetchClasses = async (): Promise<Class[]> => {
  const { data } = await axios.get("/api/faculty/assignments");
  return data.classes;
};

const updateAssignment = async (
  assignmentId: string,
  formData: AssignmentFormData
) => {
  const { data } = await axios.put(
    `/api/faculty/assignments/${assignmentId}`,
    formData
  );
  return data;
};

const EditAssignment = ({ params }: { params: { assignmentId: string } }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<AssignmentFormData>({
    title: "",
    description: "",
    dueDate: "",
    totalMarks: "",
    classroomId: "",
  });

  const {
    data: assignment,
    isLoading: assignmentLoading,
    isError: assignmentError,
  } = useQuery({
    queryKey: ["assignment", params.assignmentId],
    queryFn: () => fetchAssignment(params.assignmentId),
  });

  const {
    data: classes,
    isLoading: classesLoading,
    isError: classesError,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title,
        description: assignment.description,
        dueDate: new Date(assignment.dueDate).toISOString().split("T")[0],
        totalMarks: assignment.totalMarks.toString(),
        classroomId: assignment.classroom.id,
      });
    }
  }, [assignment]);

  const mutation = useMutation({
    mutationFn: () => updateAssignment(params.assignmentId, formData),
    onSuccess: () => {
      toast.success("Assignment updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["assignment", params.assignmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      router.push(`/faculty/assignments/${params.assignmentId}`);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(
        apiError.response?.data?.error ||
          apiError.message ||
          "Failed to update assignment"
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const isLoading = assignmentLoading || classesLoading;
  const isError = assignmentError || classesError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-6 py-8">
        <ToastContainer />
        <Button onClick={() => router.back()} variant="outline" className="mb-4">
          <ArrowLeftIcon className="mr-2 w-4 h-4" /> Back
        </Button>
        <Card className="rounded-xl shadow border border-red-200">
          <CardContent className="py-8 text-center text-red-600">
            Failed to load assignment data. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <ToastContainer />
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow mb-6">
        <Button onClick={() => router.back()} variant="ghost" className="text-white mb-3">
          <ArrowLeftIcon className="mr-2 w-4 h-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Assignment</h1>
      </div>
      <Card className="rounded-2xl shadow">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                value={formData.totalMarks}
                onChange={(e) =>
                  setFormData({ ...formData, totalMarks: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="classroomId">Class</Label>
              <Select
                value={formData.classroomId}
                onValueChange={(value) =>
                  setFormData({ ...formData, classroomId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes &&
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.course.code} - {cls.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 text-white">
              {mutation.isPending && (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              )}
              {mutation.isPending ? "Updating..." : "Update Assignment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditAssignment;
