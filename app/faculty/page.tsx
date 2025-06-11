"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Dashboard } from "@/app/faculty/types/dashboard";
import { FacultyDashboard } from "./_components/FacultyDashboard";

const fetchDashboardData = async () => {
  const { data } = await axios.get<Dashboard>("/api/faculty/dashboard");
  return data;
};

export default function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["facultyDashboard"],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return <FacultyDashboard data={data} />;
}
