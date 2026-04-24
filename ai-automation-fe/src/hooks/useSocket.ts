"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";

export type SocketStatus = "connecting" | "connected" | "disconnected";

interface UseSocketOptions {
  tenantId: string | undefined;
  enabled?: boolean;
}

interface UseSocketReturn {
  status: SocketStatus;
  socket: Socket | null;
  /** Increments each time socket reconnects after a disconnect. Use to trigger data resync. */
  reconnectCount: number;
}

/**
 * Hook quản lý Socket.IO connection tới BE WebSocket Gateway.
 * - Auto-connect khi có tenantId + enabled
 * - JWT auth qua Supabase session
 * - Auto-reconnect (Socket.IO built-in)
 * - Cleanup khi unmount hoặc đổi tenant
 * - reconnectCount: tăng mỗi khi reconnect → consumer dùng để re-fetch data
 */
export function useSocket({
  tenantId,
  enabled = true,
}: UseSocketOptions): UseSocketReturn {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const mountedRef = useRef(true);
  const hasConnectedOnceRef = useRef(false);

  useEffect(() => {
    if (!tenantId || !enabled) {
      return;
    }

    mountedRef.current = true;
    hasConnectedOnceRef.current = false;
    let newSocket: Socket | null = null;

    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!mountedRef.current) return;

      const token = data?.session?.access_token;
      if (!token) {
        console.warn("[WS] No auth token — skip connect");
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      newSocket = io(apiUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
      });

      newSocket.on("connect", () => {
        if (!mountedRef.current) return;

        // Phân biệt connect lần đầu vs reconnect
        if (hasConnectedOnceRef.current) {
          console.log("[WS] Reconnected:", newSocket?.id);
          setReconnectCount((prev) => prev + 1);
        } else {
          console.log("[WS] Connected:", newSocket?.id);
          hasConnectedOnceRef.current = true;
        }

        setStatus("connected");
      });

      newSocket.on("disconnect", (reason) => {
        if (mountedRef.current) {
          setStatus("disconnected");
          console.log("[WS] Disconnected:", reason);
        }
      });

      newSocket.on("connect_error", (err) => {
        if (mountedRef.current) {
          setStatus("disconnected");
        }
        console.warn("[WS] Connection error:", err.message);
      });

      newSocket.on(
        "authenticated",
        (authData: { sellerId: string; rooms: string[] }) => {
          console.log("[WS] Authenticated — rooms:", authData.rooms);
        },
      );

      if (mountedRef.current) {
        setStatus("connecting");
        setSocket(newSocket);
      }
    });

    return () => {
      mountedRef.current = false;
      if (newSocket) {
        newSocket.disconnect();
      }
      setSocket(null);
      setStatus("disconnected");
    };
  }, [tenantId, enabled]);

  return { status, socket, reconnectCount };
}
