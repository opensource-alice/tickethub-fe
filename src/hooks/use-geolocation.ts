'use client';

import { useState, useEffect } from 'react';

interface GeolocationState {
  city: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  isDetected: boolean;
}

const DEFAULT_CITY = 'New York';
const DEFAULT_COUNTRY = 'US';

export function useGeolocation(): GeolocationState {
  const [geoState, setGeoState] = useState<GeolocationState>({
    city: DEFAULT_CITY,
    countryCode: DEFAULT_COUNTRY,
    latitude: null,
    longitude: null,
    isLoading: true,
    isDetected: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Approximate reverse geocoding via free public API or heuristic
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          if (res.ok) {
            const data = await res.json();
            const detectedCity = data.city || data.locality || DEFAULT_CITY;
            const detectedCountry = data.countryCode || DEFAULT_COUNTRY;
            setGeoState({
              city: detectedCity,
              countryCode: detectedCountry,
              latitude,
              longitude,
              isLoading: false,
              isDetected: true,
            });
            return;
          }
        } catch (e) {
          // fallback to defaults on network error
        }

        setGeoState({
          city: DEFAULT_CITY,
          countryCode: DEFAULT_COUNTRY,
          latitude,
          longitude,
          isLoading: false,
          isDetected: false,
        });
      },
      () => {
        // User denied geolocation or error
        setGeoState({
          city: DEFAULT_CITY,
          countryCode: DEFAULT_COUNTRY,
          latitude: null,
          longitude: null,
          isLoading: false,
          isDetected: false,
        });
      },
      { timeout: 5000 },
    );
  }, []);

  return geoState;
}
