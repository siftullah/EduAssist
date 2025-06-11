"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { motion } from "framer-motion";
import { User, Save, Loader2 } from "lucide-react";
import Loader from "../../../components/ReminderLoader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string;
  batch: string;
  university: string;
}

interface ProfileUpdateData {
  first_name: string;
  last_name: string;
  email: string;
}

// Axios function to fetch profile data
const fetchProfileData = async (): Promise<ProfileData> => {
  const { data } = await axios.get("/api/student/profile");
  return data;
};

// Axios function to update profile
const updateProfile = async (
  profileData: ProfileUpdateData
): Promise<ProfileData> => {
  const { data } = await axios.put("/api/student/profile", profileData);
  return data;
};

const Profile = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ProfileUpdateData>({
    first_name: "",
    last_name: "",
    email: "",
  });

  // Fetch profile data using React Query
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profileData"],
    queryFn: fetchProfileData,
  });

  // Set form data when profile data is loaded
  useEffect(() => {
    if (profileData) {
      setFormData({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
      });
    }
  }, [profileData]);

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ["profileData"] });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 via-blue-50/30 to-white px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-6 h-6 text-gray-700" />
            </div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="font-bold text-gray-900 text-3xl"
            >
              My Profile
            </motion.h1>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
            <Card className="md:col-span-1 bg-white shadow-sm border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-2"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-900">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-4">
                <Avatar className="mb-6 border-4 border-blue-100 w-32 h-32">
                  <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                  <AvatarFallback className="bg-blue-700 text-white text-2xl">
                    {formData.first_name?.[0]}
                    {formData.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    disabled
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Change Picture
                  </Button>
                </motion.div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 bg-white shadow-sm border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-2"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-900">
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-800">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
                        }
                        className="border-blue-200 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-800">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_name: e.target.value,
                          })
                        }
                        className="border-blue-200 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-800">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="border-blue-200 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber" className="text-gray-800">
                      Roll Number
                    </Label>
                    <Input
                      id="rollNumber"
                      value={profileData?.roll_number || ""}
                      disabled
                      className="bg-blue-50 border-blue-200 text-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch" className="text-gray-800">
                      Batch
                    </Label>
                    <Input
                      id="batch"
                      value={profileData?.batch || ""}
                      disabled
                      className="bg-blue-50 border-blue-200 text-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university" className="text-gray-800">
                      University
                    </Label>
                    <Input
                      id="university"
                      value={profileData?.university || ""}
                      disabled
                      className="bg-blue-50 border-blue-200 text-gray-700"
                    />
                  </div>
                  <motion.div
                    className="pt-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {updateProfileMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;
