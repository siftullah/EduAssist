import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function Loader() {
  return (
    <div className="px-4 sm:px-0 py-6">
      <Skeleton className="bg-gray-300 mb-6 w-64 h-8" />
      <Card>
        <CardHeader>
          <Skeleton className="bg-gray-300 mb-6 w-64 h-8" />
        </CardHeader>
        <CardContent>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="bg-gray-300 w-48 h-4" />
              <Skeleton className="bg-gray-300 w-56 h-4" />
              <Skeleton className="bg-gray-300 w-52 h-4" />
              <Skeleton className="bg-gray-300 w-44 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="bg-gray-300 w-32 h-6" />
          <Skeleton className="bg-gray-300 w-36 h-10" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="bg-gray-300 w-3/4 h-6" />
              </CardHeader>
              <CardContent>
                <Skeleton className="bg-gray-300 w-full h-20" />
                <div className="flex items-center gap-2 mt-4">
                  <Skeleton className="bg-gray-300 w-24 h-4" />
                  <Skeleton className="bg-gray-300 rounded-full w-4 h-4" />
                  <Skeleton className="bg-gray-300 w-32 h-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
