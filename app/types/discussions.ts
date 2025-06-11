export interface Discussion {
  id: string;
  title: string;
  type: "general" | "custom" | "batch" | "department";
  main_post: {
    id: string;
    description: string;
    created_by: string;
  };
  reply_count: number;
}

export interface DiscussionsData {
  threads: Discussion[];
}

export interface AvailableGroups {
  forums: {
    id: string;
    forum_name: string;
    group?: { name: string } | null;
  }[];
  batches: {
    id: string;
    name: string;
  }[];
  departments: {
    id: string;
    name: string;
  }[];
}

export interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
}

export interface CreateDiscussionData {
  title: string;
  description: string;
  type: "general" | "private" | "batch" | "department";
  forumId?: string;
  batchId?: string;
  departmentId?: string;
  groupName?: string;
  members?: string[];
}
