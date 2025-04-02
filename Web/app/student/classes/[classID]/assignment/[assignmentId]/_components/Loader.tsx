import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon } from "lucide-react";

const Loader = () => {
  return (
    <div className="px-4 sm:px-0 py-6">
      <Button disabled className="flex items-center mb-4">
        <ArrowLeftIcon className="mr-2 w-4 h-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          {/* Title skeleton */}
          <Skeleton className="bg-gray-300 w-1/3 h-8" />
          {/* Created by skeleton */}
          <Skeleton className="bg-gray-300 mt-2 w-1/4 h-4" />
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Description section */}
            <div>
              <div className="space-y-2">
                <Skeleton className="bg-gray-300 w-full h-4" />
                <Skeleton className="bg-gray-300 w-3/4 h-4" />
              </div>
            </div>

            {/* Attachments section */}
            <div>
              <div className="flex items-center gap-2 bg-gray-50 mb-4 p-2 rounded-md w-1/2">
                <Skeleton className="bg-gray-300 w-full h-4" />
              </div>
            </div>

            {/* Due date and marks */}
            <div className="flex items-center space-x-4">
              <Skeleton className="bg-gray-300 w-40 h-4" />
              <Skeleton className="bg-gray-300 w-32 h-4" />
            </div>

            {/* Submission status section */}
            <div>
              <div className="space-y-4">
                <Skeleton className="bg-gray-300 w-24 h-6" />

                {/* Submission details skeleton */}
                <div className="space-y-4 mt-4">
                  <Skeleton className="bg-gray-300 w-1/3 h-4" />
                  <Skeleton className="bg-gray-300 w-1/4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Loader;
