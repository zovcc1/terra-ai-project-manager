import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { wsConnect, subscribeNotifications } from "@/lib/websocket";
import type { NotificationResponse } from "@/lib/api";

// ---------- global module state (singleton) ----------
let notificationUnsubscribe: (() => void) | null = null;
let subscribed = false; // منع تكرار الاشتراك
let lastToken: string | null = null;

export function useWebSocket() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const tokenRef = useRef(token);

  useEffect(() => {
    // لا token => لا شيء
    if (!token) return;

    // إذا تغير التوكن، نلغي الاشتراك السابق
    if (lastToken && lastToken !== token) {
      notificationUnsubscribe?.();
      notificationUnsubscribe = null;
      subscribed = false;
      lastToken = null;
    }

    // تحديث lastToken
    lastToken = token;
    tokenRef.current = token;

    // إذا كنا مشتركين بالفعل، لا تفعل شيئًا
    if (subscribed) return;

    // بدء الاتصال والاشتراك
    const connectAndSubscribe = async () => {
      try {
        await wsConnect(token);
        // وصلنا، ننشئ اشتراك الإشعارات
        notificationUnsubscribe = subscribeNotifications(
          (notification: NotificationResponse) => {
            // تحديث كاش React Query مباشرة
            queryClient.setQueryData<NotificationResponse[]>(
              ["unreadNotifications"],
              (old = []) => {
                if (old.some((n) => n.id === notification.id)) return old;
                return [notification, ...old];
              }
            );
            queryClient.setQueryData<NotificationResponse[]>(
              ["recentNotifications"],
              (old = []) => {
                if (old.some((n) => n.id === notification.id)) return old;
                return [notification, ...old];
              }
            );
          }
        );
        subscribed = true;
      } catch (err) {
        console.error("WebSocket connection failed", err);
      }
    };

    connectAndSubscribe();

    // Cleanup لا يلغي الاشتراك عند إعادة التصيير (نحافظ على Singleton)
    return () => {
      // لا شيء هنا، لأننا نريد بقاء الاشتراك نشطًا
    };
  }, [token]); // نعيد فقط إذا تغير token فعلاً

  // تنظيف نهائي عند إلغاء تحميل التطبيق بالكامل
  useEffect(() => {
    return () => {
      notificationUnsubscribe?.();
      subscribed = false;
      lastToken = null;
    };
  }, []);
}