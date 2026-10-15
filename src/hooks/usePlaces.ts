import { useState, useEffect, useCallback } from 'react';
import { PlaceDocument, PlaceType } from '../types';
import { getPlaces, getPlacesInBounds } from '../services/firestore';

export function usePlaces(initialType?: PlaceType) {
  const [places, setPlaces] = useState<PlaceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async (type?: PlaceType) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlaces({ type, status: 'approved' });
      setPlaces(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load places');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInBounds = useCallback(async (bounds: { north: number; south: number; east: number; west: number }) => {
    try {
      const data = await getPlacesInBounds(bounds);
      setPlaces(data);
    } catch (err: any) {
      console.warn('Failed to load places in bounds:', err);
    }
  }, []);

  useEffect(() => {
    fetchPlaces(initialType);
  }, [fetchPlaces, initialType]);

  const refresh = () => fetchPlaces(initialType);

  return { places, loading, error, refresh, loadInBounds };
}
