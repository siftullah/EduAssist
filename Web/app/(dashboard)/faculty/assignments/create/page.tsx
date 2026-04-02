"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeftIcon, Loader2, X } from "lucide-react";
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

interface FileUpload {
  file: File;
  uploading: boolean;
  error?: string;
}

interface AssignmentData {
  title: string;
  description: string;
  dueDate: string;
  totalMarks: string;
  classroomId: string;
  attachments: { filename: string; filepath: string }[];
}

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

const fetchClasses = async (): Promise<Class[]> => {
  const { data } = await axios.get("/api/faculty/assignments");
  return data.classes;
};

const uploadFile = async (file: File) => {
  return {
    filename: file.name,
    filepath: URL.createObjectURL(file),
  };
};

const createAssignment = async (assignmentData: AssignmentData) => {
  const { data } = await axios.post("/api/faculty/assignments", assignmentData);
  return data;
};

const CreateAssignment = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileUpload[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalMarks: "",
    classroomId: "",
  });

  const {
    data: classes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const uploadedFiles = await Promise.all(
        files.map(async ({ file }) => {
          const result = await uploadFile(file);
          return {
            filename: result.filename,
            filepath: result.filepath,
          };
        })
      );

      return createAssignment({
        ...formData,
        attachments: uploadedFiles,
      });
    },
    onSuccess: () => {
      toast.success("Assignment created successfully");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      router.push("/faculty/assignments");
    },
    onError: (error: AxiosError) => {
      console.error("Error:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to create assignment"
      );
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []).map((file) => ({
      file,
      uploading: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Error loading classes. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-10 py-8">
      <ToastContainer />
      <Button onClick={() => router.back()} className="flex items-center mb-4 text-blue-600">
        <ArrowLeftIcon className="mr-2 w-4 h-4" /> Back
      </Button>
      <Card className="rounded-xl border border-blue-100 shadow-md">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-xl px-6 py-4">
          <h1 className="text-xl md:text-2xl font-bold">Create New Assignment</h1>
        </div>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
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
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1">
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
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label htmlFor="attachments">Attachments</Label>
              <Input
                id="attachments"
                type="file"
                onChange={handleFileChange}
                multiple
                className="cursor-pointer"
              />
              {files.length > 0 && (
                <div className="space-y-2 mt-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-slate-50 p-2 rounded-md"
                    >
                      <span className="flex-1 truncate text-sm">{file.file.name}</span>
                      {file.uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4">
              <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {mutation.isPending && (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                )}
                {mutation.isPending ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAssignment;