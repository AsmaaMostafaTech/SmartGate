"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "./supabase-client";
import type { RealtimeNotification } from "./types";

interface UseRealtimeNotificationsOptions {
  // when "parent", subscribes to a specific student's notifications
  // when "admin", subscribes to all notifications
  role: "parent" | "admin";
  studentId?: string;
  enabled?: boolean;
  onNotification?: (n: RealtimeNotification) => void;
}

// Shape of a row in the `notifications` table (snake_case, as created by Prisma @map).
interface NotificationRow {
  id: string;
  student_id: string;
  student_name: string;
  student_number: string;
  grade: string;
  type: "ENTRY" | "EXIT";
  message: string;
  parent_name: string | null;
  parent_phone: string | null;
  read: boolean;
  created_at: string;
}

function mapRow(row: NotificationRow): RealtimeNotification {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentNumber: row.student_number,
    grade: row.grade,
    type: row.type,
    message: row.message,
    parentName: row.parent_name,
    parentPhone: row.parent_phone,
    createdAt: row.created_at,
  };
}

/**
 * Subscribes to Supabase Realtime (Postgres Changes) on the `notifications` table.
 * - parent role: filtered to a single student's notifications.
 * - admin role: all notifications.
 * A new INSERT arrives here automatically whenever the /api/scan route writes a
 * notification — no extra push call needed.
 */
export function useRealtimeNotifications({
  role,
  studentId,
  enabled = true,
  onNotification,
}: UseRealtimeNotificationsOptions) {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const onNotifRef = useRef(onNotification);
  useEffect(() => {
    onNotifRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled) return;
    if (!supabase) return;
    if (role === "parent" && !studentId) return;

    const filter =
      role === "parent" && studentId ? `student_id=eq.${studentId}` : undefined;

    const channelName = `notifications:${role}:${
      role === "parent" ? studentId : "all"
    }`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const row = payload.new as NotificationRow;
          const mapped = mapRow(row);
          setNotifications((prev) => [mapped, ...prev].slice(0, 50));
          onNotifRef.current?.(mapped);
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [role, studentId, enabled]);

  const clear = useCallback(() => setNotifications([]), []);

  return { connected, notifications, clear };
}
