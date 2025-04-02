import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Thread } from "@/app/types/classroom";

const AnnouncementCard = ({ announcements }: { announcements: Thread[] }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => {
        return (
          <Link key={announcement.id} href={`${pathname}/${announcement.id}`}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{announcement.title}</CardTitle>
                  <Badge>Announcement</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {announcement.main_post.description}
                </p>
                <div className="flex items-center mt-4 text-gray-500 text-sm">
                  <Calendar className="mr-2 w-4 h-4" />
                  <span>{formatDate(announcement.main_post.createdAt)}</span>
                  <span className="mx-2">•</span>
                  <span>By: {announcement.main_post.author}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default AnnouncementCard;
