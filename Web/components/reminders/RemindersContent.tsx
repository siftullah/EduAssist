"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Reminder {
  id: string;
  title: string;
  description: string;
  reminder_date: string;
  user_id: string;
}

export default function RemindersContent() {
  const { user } = useUser();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const fetchReminders = async () => {
    try {
      const response = await fetch(`/api/reminders?userId=${user?.id}`);
      const data = await response.json();
      setReminders(data);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchReminders();
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', {
        ...formData,
        user_id: user?.id,
        id: editingReminder?.id,
      });

      const response = await fetch("/api/reminders", {
        method: editingReminder ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          user_id: user?.id,
          id: editingReminder?.id,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', data);
        alert(data.error || 'Failed to save reminder');
        return;
      }

      console.log('Success response:', data);
      setIsModalOpen(false);
      setEditingReminder(null);
      setFormData({ title: "", description: "", due_date: "" });
      fetchReminders();
    } catch (error) {
      console.error("Error saving reminder:", error);
      alert('Failed to save reminder. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        const response = await fetch(`/api/reminders/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          fetchReminders();
        }
      } catch (error) {
        console.error("Error deleting reminder:", error);
      }
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description,
      due_date: new Date(reminder.reminder_date).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  if (isModalOpen) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-2xl font-bold">
                {editingReminder ? "Edit Reminder" : "Create New Reminder"}
              </h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-primary/90 h-9 px-4 py-2"
              >
                {editingReminder ? "Update Reminder" : "Create Reminder"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          setEditingReminder(null);
          setFormData({ title: "", description: "", due_date: "" });
          setIsModalOpen(true);
        }}
        className="mb-6 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-primary/90 h-9 px-4 py-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Reminder
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {reminder.title}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(reminder)}
                  className="text-gray-600 hover:text-blue-500"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="text-gray-600 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{reminder.description}</p>
            <div className="text-sm text-gray-500">
              Due: {format(new Date(reminder.reminder_date), "PPp")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 