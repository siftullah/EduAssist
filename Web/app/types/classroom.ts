export interface ClassroomDetails {
  id: string;
  name: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  teachers: {
    faculty: {
      id: string;
      name: string;
      email: string;
    }[];
    ta: {
      id: string;
      name: string;
      email: string;
    }[];
  };
  students: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
  }[];
  threads: {
    announcements: Announcement[];
    discussions: {
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
    }[];
    assignments: Assignment[];
    stats: {
      studentCount: number;
      assignmentCount: number;
      announcementCount: number;
    };
  };
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  author: string;
  attachments: Attachment[];
}

export interface Discussion {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  author: string;
  attachments: Attachment[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  author: string;
  assignment?: {
    id: string;
    dueDate: string;
    totalMarks: number;
    submissionCount: number;
    pendingGrading: number;
  };
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  filepath: string;
}
