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
import { toast } from "react-toastify";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface CreatePostData {
  formData: FormData;
  classId: string;
}

const createClassPost = async ({ formData, classId }: CreatePostData) => {
  const { data } = await axios.post(
    `/api/faculty/classes/${classId}/create-post`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
};

const CreateClassPost = ({ params }: { params: { classID: string } }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      createClassPost({ formData, classId: params.classID }),
    onSuccess: () => {
      toast.success("Post created successfully");
      queryClient.invalidateQueries({
        queryKey: ["classDetails", params.classID],
      });
      router.push(`/faculty/classes/${params.classID}`);
    },
    onError: (error) => {
      console.error("Error:", error);
      toast.error("Failed to create post");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL for supported file types
      if (selectedFile.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(selectedFile));
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    if (file) {
      formData.append("attachment", file);
    }

    mutation.mutate(formData);
  };

  return (
    <div className="px-4 sm:px-0 py-6">
      <Button onClick={() => router.back()} variant="ghost" className="mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Class Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Post Type</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter post title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter post description"
                required
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="attachment">Attachment (optional)</Label>
              <div className="space-y-2">
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                {file && (
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    {filePreview ? (
                      <Image
                        src={filePreview}
                        alt="Preview"
                        width={40}
                        height={40}
                        className="rounded w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="flex justify-center items-center bg-gray-200 rounded w-10 h-10">
                        {file.name.split(".").pop()?.toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              )}
              {mutation.isPending ? "Creating..." : "Create Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateClassPost;
