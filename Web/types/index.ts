export interface University {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  university_id: string;
  name: string;
}

export interface Course {
  id: string;
  dept_id: string;
  course_name: string;
  course_code: string;
}

export interface Batch {
  id: string;
  university_id: string;
  name: string;
}

export interface DepartmentBatch {
  id: string;
  dept_id: string;
  batch_id: string;
}

export interface Student {
  id: string;
  user_id: string;
  department_batch_id: string;
  roll_number: string;
}

export interface Faculty {
  id: string;
  user_id: string;
  dept_id: string;
}

export interface Classroom {
  id: string;
  name: string;
  course_id: string;
}

export interface Enrollment {
  id: string;
  classroom_id: string;
  student_id: string;
}

export interface ClassroomTeacher {
  id: string;
  classroom_id: string;
  type: string;
  user_id: string; // Clerk user ID
}

export interface ClassroomThread {
  id: string;
  classroom_id: string;
  title: string;
  main_post_id: string | null;
  created_by: string; // Clerk user ID
  type: "announcement" | "discussion" | "assignment";
}

export interface ClassroomPost {
  id: string;
  thread_id: string;
  created_by: string; // Clerk user ID
  description: string;
  type: "main" | "reply";
}

export interface Assignment {
  id: string;
  due_date: Date;
  classroom_id: string;
  thread_id: string;
  total_marks: number;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  marks?: number;
  submitted_on: Date;
}

export interface Group {
  id: string;
  name: string;
  created_at: string;
  type: "department" | "batch" | "custom";
}

export interface BatchGroup {
  id: string;
  group_id: string;
  batch_id: string;
}

export interface DepartmentGroup {
  id: string;
  group_id: string;
  department_id: string;
}

export interface CustomGroup {
  id: string;
  group_id: string;
  description?: string;
}

export interface CustomGroupMembers {
  id: string;
  custom_group_id: string;
  user_id: string;
}

export interface Forum {
  id: string;
  university_id: string;
  created_by: string; // Clerk user ID
  forum_name: string;
  group_id?: string;
}

export interface Thread {
  id: string;
  forum_id?: string;
  university_id: string;
  main_post_id?: string;
  group_id?: string;
  title: string;
  type: "announcement" | "discussion" | "department" | "batch" | "private";
}

export interface ThreadPost {
  id: string;
  thread_id: string;
  created_by: string; // Clerk user ID
  type: "main" | "reply";
  description: string;
  created_on: Date;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  role: "faculty" | "student" | "admin";
  university_id: string;
}
