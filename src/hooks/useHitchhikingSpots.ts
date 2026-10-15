import { useState, useEffect, useCallback } from 'react';
import { HitchhikingSpot } from '../types';
import { getHitchhikingSpots, getHitchhikingSpotsInBounds } from '../services/firestore';

export function useHitchhikingSpots() {
  const [spots, setSpots] = useState<HitchhikingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHitchhikingSpots({ status: 'approved' });
      setSpots(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load hitchhiking spots');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInBounds = useCallback(async (bounds: { north: number; south: number; east: number; west: number }) => {
    try {
      const data = await getHitchhikingSpotsInBounds(bounds);
      setSpots(data);
    } catch (err: any) {
      console.warn('Failed to load hitchhiking spots in bounds:', err);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  const refresh = () => fetchSpots();

  return { spots, loading, error, refresh, loadInBounds };
}
