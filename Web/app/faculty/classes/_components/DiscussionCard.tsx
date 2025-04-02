import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Paperclip, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Discussion {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  author: string;
  attachments: {
    id: string;
    filename: string;
    filepath: string;
  }[];
}

const DiscussionCard = ({ discussions }: { discussions: Discussion[] }) => {
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
      {discussions.map((discussion) => (
        <Link key={discussion.id} href={`${pathname}/${discussion.id}`}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{discussion.title}</CardTitle>
                <Badge variant="secondary">
                  <MessageCircle className="mr-1 w-4 h-4" />
                  Discussion
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{discussion.description}</p>
              <div className="flex items-center mt-4 text-gray-500 text-sm">
                <Calendar className="mr-2 w-4 h-4" />
                <span>{formatDate(discussion.createdAt)}</span>
                <span className="mx-2">•</span>
                <span>By: {discussion.author}</span>
                {discussion.attachments.length > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <Paperclip className="mr-1 w-4 h-4" />
                    <span>{discussion.attachments.length} attachments</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default DiscussionCard;
