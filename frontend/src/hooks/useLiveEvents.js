import { useEffect, useRef, useState } from "react";

import { getWebSocketUrl } from "../services/api";

export function useLiveEvents(token, { enabled = true, maxEvents = 8 } = {}) {
  const [connected, setConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const reconnectTimerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled || !token) {
      setConnected(false);
      return undefined;
    }

    let closed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      const socket = new WebSocket(getWebSocketUrl("/ws/live", token));
      socketRef.current = socket;

      socket.onopen = () => {
        if (closed) return;
        setConnected(true);
      };

      socket.onmessage = (message) => {
        if (closed) return;
        try {
          const event = JSON.parse(message.data);
          setLatestEvent(event);
          setEvents((current) => [event, ...current].slice(0, maxEvents));
        } catch {
          // Ignore malformed messages from the live channel.
        }
      };

      socket.onerror = () => {
        if (closed) return;
        socket.close();
      };

      socket.onclose = () => {
        if (closed) return;
        setConnected(false);
        socketRef.current = null;
        if (!closed) {
          clearReconnectTimer();
          reconnectTimerRef.current = window.setTimeout(connect, 1500);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      clearReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, token, maxEvents]);

  return {
    connected,
    latestEvent,
    events,
  };
}
