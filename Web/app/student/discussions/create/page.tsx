"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface AvailableGroups {
  forums: {
    id: string;
    forum_name: string;
    group?: { name: string } | null;
  }[];
  batch: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
}

const CreateDiscussion = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<
    "general" | "private" | "batch" | "department"
  >("general");
  const [forumId, setForumId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      first_name: string;
      last_name: string;
    }>
  >([]);
  const [, setFile] = useState<File | null>(null);
  const [availableGroups, setAvailableGroups] =
    useState<AvailableGroups | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableGroups = async () => {
      try {
        const response = await fetch(
          "/api/student/discussions/available-groups"
        );
        const data = await response.json();
        setAvailableGroups(data);
      } catch (error) {
        console.error("Error fetching available groups:", error);
        toast.error("Failed to load available groups");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableGroups();
  }, []);

  useEffect(() => {
    const searchStudents = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/student/discussions/search-students?query=${encodeURIComponent(
            searchQuery
          )}`
        );
        const data = await response.json();
        setSearchResults(data.students);
      } catch (error) {
        console.error("Error searching students:", error);
        toast.error("Failed to search students");
      }
    };

    const timeoutId = setTimeout(searchStudents, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/student/discussions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          type,
          forumId: type === "general" ? forumId : undefined,
          groupName: type === "private" ? newGroupName : undefined,
          members: type === "private" ? selectedMembers : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create discussion");
      }

      toast.success("Discussion created successfully");
      router.push("/student/discussions");
    } catch (error) {
      console.error("Error creating discussion:", error);
      toast.error("Failed to create discussion");
    }
  };

  if (loading) {
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
                placeholder="Enter discussion title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter discussion description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                onValueChange={(value) =>
                  setType(
                    value as "general" | "private" | "batch" | "department"
                  )
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
            {type === "general" && (
              <div>
                <Label htmlFor="forum">Forum</Label>
                <Select onValueChange={setForumId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select forum" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups?.forums.map((forum) => (
                      <SelectItem key={forum.id} value={forum.id}>
                        {forum.forum_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {type === "batch" && (
              <div>
                <Label>Batch</Label>
                <p className="mt-1 text-gray-500 text-sm">
                  {availableGroups?.batch.name || "No batch assigned"}
                </p>
              </div>
            )}
            {type === "department" && (
              <div>
                <Label>Department</Label>
                <p className="mt-1 text-gray-500 text-sm">
                  {availableGroups?.department.name || "No department assigned"}
                </p>
              </div>
            )}
            {type === "private" && (
              <>
                <div>
                  <Label htmlFor="newGroupName">New Group Name</Label>
                  <Input
                    id="newGroupName"
                    placeholder="Enter new group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                      {selectedMembers.map((memberId) => {
                        const user = searchResults.find(
                          (u) => u.id === memberId
                        );
                        return (
                          <div
                            key={memberId}
                            className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                          >
                            <span>
                              {user?.first_name} {user?.last_name}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedMembers((prev) =>
                                  prev.filter((id) => id !== memberId)
                                )
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Label>Search Members</Label>
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {searchQuery && searchResults.length > 0 && (
                    <div className="p-2 border rounded-md max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 hover:bg-gray-100 p-2"
                        >
                          <Checkbox
                            id={user.id}
                            checked={selectedMembers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              setSelectedMembers((prev) =>
                                checked
                                  ? [...prev, user.id]
                                  : prev.filter((id) => id !== user.id)
                              );
                            }}
                          />
                          <label htmlFor={user.id}>
                            {user.first_name} {user.last_name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <div>
              <Label htmlFor="attachment">Attachment (optional)</Label>
              <Input
                id="attachment"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            <Button type="submit">Create Discussion</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateDiscussion;
