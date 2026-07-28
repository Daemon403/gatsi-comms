'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrder } from '@/lib/actions/orders';

const POLL_INTERVAL = 15000;

export function useOrderPolling(orderId: string) {
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrder>>['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchOrder = useCallback(async () => {
    const result = await getOrder(orderId);
    if (!mountedRef.current) return;
    if (result.data) {
      setOrder(result.data);
      setError(null);
    } else {
      setError(result.error || 'Order not found');
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchOrder();

    const interval = setInterval(() => {
      fetchOrder();
    }, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchOrder]);

  const refresh = useCallback(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refresh };
}
