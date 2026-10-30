'use client';

import { useState, useEffect, useCallback } from 'react';
import { EventItem } from '@/types';
import { toast } from 'sonner';

const FAVORITES_STORAGE_KEY = 'tickethub_favorites_v1';
const FAVORITES_EVENT = 'tickethub_favorites_change';

export function useFavorites() {
  const [favorites, setFavorites] = useState<EventItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites([]);
      }
    } catch (e) {
      console.error('Failed to load favorites from localStorage', e);
      setFavorites([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFavorites();

    const handleStorageChange = () => {
      loadFavorites();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(FAVORITES_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(FAVORITES_EVENT, handleStorageChange);
    };
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((item) => item.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (event: EventItem) => {
      try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const current: EventItem[] = stored ? JSON.parse(stored) : [];
        const exists = current.some((item) => item.id === event.id);

        let updated: EventItem[];
        if (exists) {
          updated = current.filter((item) => item.id !== event.id);
          toast.info('Removed from favorites', {
            description: event.name,
          });
        } else {
          updated = [event, ...current];
          toast.success('Saved to favorites', {
            description: event.name,
          });
        }

        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
        setFavorites(updated);
        window.dispatchEvent(new Event(FAVORITES_EVENT));
      } catch (e) {
        toast.error('Could not update favorites');
      }
    },
    [],
  );

  return {
    favorites,
    isLoaded,
    isFavorite,
    toggleFavorite,
  };
}
