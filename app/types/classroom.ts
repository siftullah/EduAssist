export interface ClassroomDetails {
  id: string;
  name: string;
  courseInfo: {
    code: string;
    name: string;
  };
  teachers: {
    faculty: {
      id: string;
      name: string;
    }[];
    ta: {
      id: string;
      name: string;
    }[];
  };
  studentCount: number;
  threads: {
    announcements: Announcement[];
    assignments: Assignment[];
    discussions: Discussion[];
  };
}

export interface Announcement {
  id: string;
  title: string;
  main_post: {
    id?: string;
    description: string;
    createdAt: string;
    author: string;
  };
}

export interface Discussion {
  id: string;
  title: string;
  main_post: {
    id?: string;
    description: string;
    createdAt: string;
    author: string;
  };
  reply_count: number;
}

export interface Assignment {
  id: string;
  title: string;
  assignment: {
    id?: string;
    dueDate: string;
    totalMarks: number;
    marks?: number;
  };
  main_post: {
    id?: string;
    description: string;
    createdAt: string;
    author: string;
  };
}

export interface Attachment {
  id: string;
  filename: string;
  filepath: string;
}
