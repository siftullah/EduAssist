"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import ForumCard from "@/components/ForumCard";
import Loader from "./_components/Loader";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Forum } from "@/app/types/forum";

interface ForumsResponse {
  forums: Forum[];
}

// Axios function to fetch forums
const fetchForums = async (): Promise<ForumsResponse> => {
  try {
    const { data } = await axios.get("/api/student/forums");
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Failed to fetch forums");
    }
    throw error;
  }
};

const Forums = () => {
  // Fetch forums using TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["forums"],
    queryFn: fetchForums,
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load forums. Please try again.",
      variant: "destructive",
    });
  }

  const forums = data?.forums || [];

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
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-2 mb-4 font-bold text-gray-900 text-3xl"
          >
            <MessageCircle className="w-8 h-8 text-gray-700" />
            Current Forums
          </motion.h1>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <ForumCard forums={forums} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Forums;
