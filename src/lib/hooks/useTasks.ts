"use client";

import useSWR from "swr";
import type { Task } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  });

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<{ tasks: Task[] }>(
    "/api/tasks",
    fetcher,
    {
      refreshInterval:  30_000,   // re-fetch every 30 s
      revalidateOnFocus: true,    // refresh when tab regains focus
      dedupingInterval:  5_000,
    }
  );

  const addTask = async (payload: Omit<Task, "id" | "createdAt" | "updatedAt" | "completed">) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...payload, id: tempId, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    await mutate(
      async current => {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to add task");
        const { task } = await res.json();
        return { tasks: [...(current?.tasks ?? []), task] };
      },
      { optimisticData: { tasks: [...(data?.tasks ?? []), optimistic] }, rollbackOnError: true }
    );
  };

  const toggleTask = async (id: string) => {
    const task = data?.tasks.find(t => t.id === id);
    if (!task) return;

    await mutate(
      async current => {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !task.completed }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        const { task: updated } = await res.json();
        return { tasks: (current?.tasks ?? []).map(t => t.id === id ? updated : t) };
      },
      {
        optimisticData: { tasks: (data?.tasks ?? []).map(t => t.id === id ? { ...t, completed: !t.completed } : t) },
        rollbackOnError: true,
      }
    );
  };

  const deleteTask = async (id: string) => {
    await mutate(
      async current => {
        const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete task");
        return { tasks: (current?.tasks ?? []).filter(t => t.id !== id) };
      },
      {
        optimisticData: { tasks: (data?.tasks ?? []).filter(t => t.id !== id) },
        rollbackOnError: true,
      }
    );
  };

  const editTask = async (id: string, updates: Partial<Task>) => {
    await mutate(
      async current => {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error("Failed to edit task");
        const { task } = await res.json();
        return { tasks: (current?.tasks ?? []).map(t => t.id === id ? task : t) };
      },
      {
        optimisticData: { tasks: (data?.tasks ?? []).map(t => t.id === id ? { ...t, ...updates } : t) },
        rollbackOnError: true,
      }
    );
  };

  return {
    tasks:      data?.tasks ?? [],
    error,
    isLoading,
    mutate,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
  };
}
