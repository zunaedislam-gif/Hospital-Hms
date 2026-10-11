/**
 * Pattern HMS - Real-time SSE Synchronization Context
 * Connects to /api/realtime/stream and provides live event subscriptions
 * across Doctor, Laboratory, Waiting Display, Reception, and Finance panels.
 */
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

export interface RealtimeMessage {
  event: string;
  data: any;
  timestamp: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeMessage | null;
  subscribe: (eventName: string, handler: (data: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeMessage | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);

  const subscribe = useCallback((eventName: string, handler: (data: any) => void) => {
    if (!subscribersRef.current.has(eventName)) {
      subscribersRef.current.set(eventName, new Set());
    }
    subscribersRef.current.get(eventName)!.add(handler);

    return () => {
      const set = subscribersRef.current.get(eventName);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          subscribersRef.current.delete(eventName);
        }
      }
    };
  }, []);

  useEffect(() => {
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        const es = new EventSource('/api/realtime/stream');
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
        };

        es.onerror = () => {
          setIsConnected(false);
          es.close();
          // Auto reconnect after 4 seconds
          reconnectTimeout = setTimeout(connect, 4000);
        };

        // Standard event dispatcher
        const handleEvent = (eventName: string) => (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const msg: RealtimeMessage = {
              event: eventName,
              data: parsed.data || parsed,
              timestamp: parsed.timestamp || new Date().toISOString()
            };
            setLastEvent(msg);

            // Notify specific subscribers
            const subs = subscribersRef.current.get(eventName);
            if (subs) {
              subs.forEach(fn => fn(msg.data));
            }
            // Notify wildcard subscribers
            const wildcards = subscribersRef.current.get('*');
            if (wildcards) {
              wildcards.forEach(fn => fn(msg));
            }
          } catch (err) {
            console.error('Failed to parse realtime event payload', err);
          }
        };

        const KNOWN_EVENTS = [
          'QUEUE_ENTRY_CREATED',
          'QUEUE_UPDATED',
          'QUEUE_PATIENT_CALLED',
          'QUEUE_PATIENT_SKIPPED',
          'QUEUE_PATIENT_RECALLED',
          'QUEUE_PATIENT_COMPLETED',
          'DOCTOR_STATUS_CHANGED',
          'DOCTOR_AVAILABLE',
          'DOCTOR_BUSY',
          'DOCTOR_ON_BREAK',
          'DOCTOR_ON_PRAYER_BREAK',
          'DOCTOR_EMERGENCY',
          'CONSULTATION_STARTED',
          'CONSULTATION_UPDATED',
          'CONSULTATION_COMPLETED',
          'PRESCRIPTION_CREATED',
          'TEST_ORDER_CREATED',
          'TEST_SAMPLE_COLLECTED',
          'TEST_PROCESSING',
          'TEST_RESULT_READY',
          'TEST_RESULT_VERIFIED',
          'PAYMENT_RECEIVED',
          'PAYMENT_REFUNDED',
          'EXPENSE_CREATED',
          'EXPENSE_APPROVED',
          'COMMISSION_PAID'
        ];

        KNOWN_EVENTS.forEach(ev => {
          es.addEventListener(ev, handleEvent(ev));
        });
      } catch (e) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 4000);
      }
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
