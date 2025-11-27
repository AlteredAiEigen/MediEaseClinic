import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getStoredAccessToken } from '@/lib/api-client';

export interface QueueUpdateMessage {
  type: 'patient_checked_in' | 'patient_status_updated' | 'queue_reordered' | 'queue_update' | 'appointment_status_updated';
  timestamp: string;
  data: any;
}

export interface WebSocketHookResult {
  isConnected: boolean;
  lastMessage: QueueUpdateMessage | null;
  connectionError: string | null;
  reconnect: () => void;
}

export function useWebSocket(
  endpoint: string = 'queue',
  doctorId?: string
): WebSocketHookResult {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<QueueUpdateMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const buildWebSocketUrl = useCallback(() => {
    const token = getStoredAccessToken();
    if (!token) return null;

    let endpointBase: string | null = null;
    if (import.meta.env.VITE_WS_BASE_URL) {
      endpointBase = import.meta.env.VITE_WS_BASE_URL;
    } else if (typeof window !== 'undefined') {
      const { protocol, host, hostname } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        endpointBase = `${wsProtocol}//localhost:8000`;
      } else {
        endpointBase = `${wsProtocol}//${host}`;
      }
    }

    if (!endpointBase) {
      endpointBase = 'ws://localhost:8000';
    }

    const base = endpointBase.replace(/\/$/, '');
    let url = `${base}/ws/${endpoint}?token=${encodeURIComponent(token)}`;

    if (doctorId) {
      url = `${base}/ws/queue/doctor/${doctorId}?token=${encodeURIComponent(token)}`;
    }

    return url;
  }, [endpoint, doctorId]);

  const connect = useCallback(() => {
    if (!user) return;

    const url = buildWebSocketUrl();
    if (!url) return;

    try {
      setConnectionError(null);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: QueueUpdateMessage = JSON.parse(event.data);
          setLastMessage(message);
          console.log('WebSocket message received:', message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure and within max attempts
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (event.code !== 1000) {
          setConnectionError('Failed to reconnect after maximum attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [user, buildWebSocketUrl]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when user changes
  useEffect(() => {
    if (user) {
      reconnect();
    } else {
      disconnect();
    }
  }, [user, reconnect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connectionError,
    reconnect,
  };
}

// Specialized hook for doctor queue updates
export function useDoctorQueueWebSocket(doctorId: string): WebSocketHookResult {
  return useWebSocket('queue', doctorId);
}

// Specialized hook for general queue updates (for receptionists/admins)
export function useQueueWebSocket(): WebSocketHookResult {
  return useWebSocket('queue');
}
