"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  AvailableGroups,
  SearchResult,
  CreateDiscussionData,
} from "@/app/types/discussions";

const fetchAvailableGroups = async (): Promise<AvailableGroups> => {
  const { data } = await axios.get("/api/faculty/discussions/available-groups");
  return data;
};

const searchStudents = async (query: string): Promise<SearchResult[]> => {
  if (!query) return [];
  const { data } = await axios.get(
    `/api/faculty/discussions/search-students?query=${query}`
  );
  return data.students;
};

const CreateDiscussion = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateDiscussionData>({
    title: "",
    description: "",
    type: "general",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["availableGroups"],
    queryFn: fetchAvailableGroups,
  });

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["searchStudents", searchQuery],
    queryFn: () => searchStudents(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        "/api/faculty/discussions/create",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Discussion created successfully");
      router.push("/faculty/discussions");
    },
    onError: () => {
      toast.error("Failed to create discussion");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    // Append basic fields
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("type", formData.type);

    // Append conditional fields based on type
    if (formData.type === "general" && formData.forumId) {
      formDataToSend.append("forumId", formData.forumId);
    }
    if (formData.type === "batch" && formData.batchId) {
      formDataToSend.append("batchId", formData.batchId);
    }
    if (formData.type === "department" && formData.departmentId) {
      formDataToSend.append("departmentId", formData.departmentId);
    }
    if (formData.type === "private") {
      formDataToSend.append("groupName", newGroupName);
      selectedMembers.forEach((memberId) => {
        formDataToSend.append("members[]", memberId);
      });
    }
    if (file) {
      formDataToSend.append("attachment", file);
    }

    mutation.mutate(formDataToSend);
  };

  if (groupsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <ToastContainer />
      <Card>
        <CardHeader>
          <CardTitle>Create New Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter discussion title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter discussion description"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as CreateDiscussionData["type"],
                  }))
                }
                defaultValue="general"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="batch">Batch</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "general" && groups?.forums && (
              <div>
                <Label>Forum</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, forumId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select forum" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.forums.map((forum) => (
                      <SelectItem key={forum.id} value={forum.id}>
                        {forum.forum_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === "batch" && groups?.batches && (
              <div>
                <Label>Batch</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, batchId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === "department" && groups?.departments && (
              <div>
                <Label>Department</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, departmentId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === "private" && (
              <>
                <div>
                  <Label>Group Name</Label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    required
                  />
                </div>

                <div>
                  <Label>Search Members</Label>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                  />
                  {searchLoading && <div>Searching...</div>}
                  {searchResults.length > 0 && (
                    <div className="mt-2 p-2 border rounded-md max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 p-2"
                        >
                          <Checkbox
                            checked={selectedMembers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              setSelectedMembers((prev) =>
                                checked
                                  ? [...prev, user.id]
                                  : prev.filter((id) => id !== user.id)
                              );
                            }}
                          />
                          <span>
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <Label>Attachment (optional)</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Discussion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateDiscussion;
