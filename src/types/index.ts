export interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  type: "one-time" | "recurring";
  recurrence: "daily" | "weekly" | "monthly" | null;
  dueDate: string;       // YYYY-MM-DD
  completed: boolean;
  category: "Work" | "Health" | "Personal" | "Finance";
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface SyncLogEntry {
  userId: string;
  action: string;
  timestamp: string;
  rowsAffected: number;
}

export type TaskFilter = "all" | "today" | "upcoming" | "completed";
export type SortBy    = "date" | "priority";
export type AnalyticsRange = "week" | "month" | "all";
