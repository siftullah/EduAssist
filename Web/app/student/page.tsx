"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";



interface ClassroomData {
  id: string;
  name: string;
  course_code: string;
  course_name: string;
  teacher: string;
}

const Home = () => {
  const [classroomData, setClassroomData] = useState<ClassroomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/student/classes");
        const data = await response.json();
        setClassroomData(data);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 sm:px-0 py-6">
        <h2 className="mb-6 font-bold text-2xl">My Classes</h2>
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="relative bg-gray-400 p-0 h-32 animate-pulse" />
              <CardContent className="p-4">
                <div className="bg-gray-400 mb-2 rounded h-6 animate-pulse" />
                <div className="bg-gray-400 rounded w-2/3 h-4 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0 py-6">
      <h2 className="mb-6 font-bold text-2xl">My Classes</h2>
      <ClassList classroomData={classroomData} />
    </div>
  );
};

const ClassList = ({ classroomData }: { classroomData: ClassroomData[] }) => {
  return (
    <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      
      {classroomData.map((classroom) => (
        
        <Link key={classroom.id} href={`/student/classes/${classroom.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
            <CardHeader className="relative p-0 h-32">
              <Image
                src="https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1hdGhlbWF0aWNzfGVufDB8fDB8fHww"
                alt={classroom.name}
                fill
                className="object-cover"
              />
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-xl">
                  {classroom.course_name}
                </CardTitle>
                <p className="text-gray-600 text-xs">{classroom.course_code}</p>
              </div>
              <p className="mb-1 font-medium text-gray-600">{classroom.name}</p>
              <p className="text-gray-600 text-sm">{classroom.teacher}</p>
            </CardContent>
          </Card>
        </Link>
        
      ))}
    </div>
  );
};

export default Home;
