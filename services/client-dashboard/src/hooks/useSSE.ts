import { useEffect, useRef, useState, useCallback } from 'react';
import type { JobStatus } from '../api/content';

const SSE_URL = 'http://localhost:5001/api/notifications/stream';

export type SSEConnectionState = 'connecting' | 'connected' | 'disconnected';

interface JobUpdate {
  jobId: string;
  status: JobStatus;
  result?: string;
  error?: string;
}

export function useSSE(onUpdate: (update: JobUpdate) => void) {
  const [connectionState, setConnectionState] = useState<SSEConnectionState>('connecting');
  const esRef = useRef<EventSource | null>(null);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    setConnectionState('connecting');
    const es = new EventSource(SSE_URL);
    esRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      setConnectionState('connected');
      retryDelay.current = 1000; // reset backoff
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'connected') return; // initial handshake
        onUpdate(data as JobUpdate);
      } catch { /* ignore malformed */ }
    };

    // Named event from worker service: "job.update" or similar
    es.addEventListener('job.status', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onUpdate(data as JobUpdate);
      } catch { /* ignore */ }
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      setConnectionState('disconnected');
      // Exponential back-off (max 30s)
      const delay = Math.min(retryDelay.current, 30000);
      retryDelay.current = delay * 2;
      retryTimeout.current = setTimeout(connect, delay);
    };
  }, [onUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, [connect]);

  return connectionState;
}
