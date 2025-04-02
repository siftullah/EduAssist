import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Thread } from "@/app/types/classroom";

const DiscussionCard = ({ discussions }: { discussions: Thread[] }) => {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {discussions.map((discussion) => {
        return (
          <Card key={discussion.id}>
            <CardHeader>
              <CardTitle>{discussion.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {discussion.main_post.description}
              </p>
              <div className="flex items-center mt-4 text-gray-500 text-sm">
                <span>{discussion.main_post.author}</span>
                <span className="mx-2">•</span>
                <span>
                  {discussion.replies ? discussion.replies.length : 100} replies
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`${pathname}/${discussion.id}`}>
                <Button variant="default">View Full Discussion</Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default DiscussionCard;
