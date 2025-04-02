"use client";

import React, { useEffect, useState } from "react";
import ForumCard from "@/components/ForumCard";

const Forums = () => {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        const response = await fetch("/api/student/forums");
        const data = await response.json();
        setForums(data.forums);
      } catch (error) {
        console.error("Error fetching forums:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForums();
  }, []);

  if (loading) {
    return <div className="px-4 sm:px-0 py-6">Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <div className="flex items-center mb-6">
        <h2 className="font-bold text-2xl">Current Forums</h2>
      </div>
      <ForumCard forums={forums} />
    </div>
  );
};

export default Forums;
