import { Suspense } from "react";
import RemindersContent from "../../../components/reminders/RemindersContent";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function StudentRemindersPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Reminders</h1>
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <RemindersContent />
      </Suspense>
    </div>
  );
} 