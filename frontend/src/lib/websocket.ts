/**
 * WebSocket client — SockJS + STOMP
 *
 * Backend endpoint : http://localhost:8080/ws
 * Auth             : JWT sent in STOMP CONNECT headers
 * Topics:
 *   /topic/kanban/{projectId}         — broadcast on task mutations
 *   /topic/task/{taskId}/comments     — broadcast comment events
 *   /user/queue/notifications         — private per‑user notifications (requires backend convertAndSendToUser)
 *   /user/queue/ai-pending            — AI pending action alerts
 */

import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Task, PendingAction, NotificationResponse, Comment } from "./api";

const WS_URL = "http://localhost:8080/ws";

// Payload variants from /topic/kanban/{projectId}
export type KanbanEvent =
  | Task
  | { type: "DELETE_TASK"; taskId: number; projectId: number };

// Payload variants from /topic/task/{taskId}/comments
export type CommentEvent =
  | Comment
  | { type: "DELETE_COMMENT"; commentId: number };

// ---- Singleton client -------------------------------------------------
let stompClient: Client | null = null;
let connectPromise: Promise<void> | null = null;

// Pending subscriptions for notifications (called when connection becomes ready)
let pendingNotificationCallbacks: Array<(notification: NotificationResponse) => void> = [];
let activeNotificationSub: StompSubscription | null = null;

/** Connect (idempotent — safe to call multiple times). */
export function wsConnect(token: string): Promise<void> {
  if (stompClient?.connected) return Promise.resolve();
  if (connectPromise) return connectPromise;

  connectPromise = new Promise<void>((resolve, reject) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.debug("[WS] Connected");
        
        // Flush any pending notification subscriptions
        if (pendingNotificationCallbacks.length > 0) {
          // Unsubscribe existing if any (should not happen, but safety)
          if (activeNotificationSub) {
            activeNotificationSub.unsubscribe();
            activeNotificationSub = null;
          }
          // Create a single subscription that routes to all pending callbacks
          activeNotificationSub = client.subscribe("/user/queue/notifications", (message) => {
            try {
              const payload = JSON.parse(message.body) as NotificationResponse;
              // Call all registered callbacks
              pendingNotificationCallbacks.forEach(cb => cb(payload));
            } catch {
              console.error("[WS] Failed to parse notification", message.body);
            }
          });
        }
        
        resolve();
        connectPromise = null;
      },
      onStompError: (frame) => {
        console.error("[WS] STOMP error", frame);
        if (frame.headers?.message?.includes("Invalid")) {
          // Optionally trigger token refresh
        }
        reject(new Error(frame.headers?.message ?? "STOMP error"));
        connectPromise = null;
      },
      onWebSocketError: (event) => {
        console.error("[WS] WebSocket error", event);
      },
      onDisconnect: () => {
        console.debug("[WS] Disconnected");
        activeNotificationSub = null;
      },
    });

    client.activate();
    stompClient = client;
  });

  return connectPromise;
}

/** Disconnect and clean up. */
export function wsDisconnect(): void {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    connectPromise = null;
    activeNotificationSub = null;
    pendingNotificationCallbacks = [];
  }
}

/** Returns true when the STOMP connection is active. */
export function wsIsConnected(): boolean {
  return stompClient?.connected ?? false;
}

// ---- Subscription helpers --------------------------------------------

/**
 * Subscribe to real-time kanban events for a project.
 * Returns an unsubscribe function.
 */
export function subscribeKanban(
  projectId: number,
  callback: (event: KanbanEvent) => void,
): () => void {
  if (!stompClient?.connected) {
    console.warn("[WS] subscribeKanban called before connection");
    return () => {};
  }

  const sub: StompSubscription = stompClient.subscribe(
    `/topic/kanban/${projectId}`,
    (message) => {
      try {
        const payload = JSON.parse(message.body) as KanbanEvent;
        callback(payload);
      } catch {
        console.error("[WS] Failed to parse kanban event", message.body);
      }
    },
  );

  return () => sub.unsubscribe();
}

/**
 * Subscribe to real-time comment events for a task.
 * Returns an unsubscribe function.
 */
export function subscribeTaskComments(
  taskId: number,
  callback: (event: CommentEvent) => void,
): () => void {
  if (!stompClient?.connected) {
    console.warn("[WS] subscribeTaskComments called before connection");
    return () => {};
  }

  const sub: StompSubscription = stompClient.subscribe(
    `/topic/task/${taskId}/comments`,
    (message) => {
      try {
        const payload = JSON.parse(message.body) as CommentEvent;
        callback(payload);
      } catch {
        console.error("[WS] Failed to parse comment event", message.body);
      }
    },
  );

  return () => sub.unsubscribe();
}

/**
 * Subscribe to private user notifications.
 * Backend must use convertAndSendToUser(userId, "/queue/notifications", payload)
 * Returns an unsubscribe function.
 */
export function subscribeNotifications(
  callback: (notification: NotificationResponse) => void,
): () => void {
  // If already connected and we have an active subscription, just add the callback
  if (stompClient?.connected && activeNotificationSub) {
    pendingNotificationCallbacks.push(callback);
    // Return a function to remove this specific callback
    return () => {
      const index = pendingNotificationCallbacks.indexOf(callback);
      if (index !== -1) pendingNotificationCallbacks.splice(index, 1);
      // If no callbacks left, unsubscribe from the topic to save resources
      if (pendingNotificationCallbacks.length === 0 && activeNotificationSub) {
        activeNotificationSub.unsubscribe();
        activeNotificationSub = null;
      }
    };
  }

  // Not connected yet – store the callback for later
  pendingNotificationCallbacks.push(callback);
  
  // Return a function that removes the callback from pending queue
  return () => {
    const index = pendingNotificationCallbacks.indexOf(callback);
    if (index !== -1) pendingNotificationCallbacks.splice(index, 1);
  };
}

/**
 * Subscribe to AI pending-action alerts for the current user.
 * Returns an unsubscribe function.
 */
export function subscribeAiPending(
  callback: (action: PendingAction) => void,
): () => void {
  if (!stompClient?.connected) {
    console.warn("[WS] subscribeAiPending called before connection");
    return () => {};
  }

  const sub: StompSubscription = stompClient.subscribe(
    "/user/queue/ai-pending",
    (message) => {
      try {
        const payload = JSON.parse(message.body) as PendingAction;
        callback(payload);
      } catch {
        console.error("[WS] Failed to parse ai-pending event", message.body);
      }
    },
  );

  return () => sub.unsubscribe();
}