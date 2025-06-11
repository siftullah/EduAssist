export interface Thread {
  id: string;
  title: string;
  author: string;
  date: string;
  replies: number;
}

export interface Forum {
  id: string;
  title: string;
  group_name: string;
  created_by: string;
  thread_count: number;
  last_activity: string;
  forum_name?: string;
  threads?: Thread[];
}

export interface ForumList {
  forums: Forum[];
}
