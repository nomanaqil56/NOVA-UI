import { useRef, useEffect } from 'react';
import type { GPSLocation } from '../types/navigation';

export const useNavigationEngine = (
  rawLocation: GPSLocation | null,
  onUpdate: (location: GPSLocation) => void
) => {
  const lastLocation = useRef<GPSLocation | null>(null);
  const targetLocation = useRef<GPSLocation | null>(null);
  const startTime = useRef<number>(0);
  const animationFrame = useRef<number>(0);

  useEffect(() => {
    if (!rawLocation) return;

    if (!lastLocation.current) {
      // First fix
      lastLocation.current = rawLocation;
      targetLocation.current = rawLocation;
      onUpdate(rawLocation);
      return;
    }

    // New target received
    lastLocation.current = targetLocation.current; // Start from where we were supposed to be
    targetLocation.current = rawLocation;
    startTime.current = performance.now();

    const animate = (time: number) => {
      if (!lastLocation.current || !targetLocation.current) return;
      
      const duration = 1000; // Expected GPS update interval
      let progress = (time - startTime.current) / duration;
      if (progress > 1) progress = 1;

      // Linear easing for continuous movement, but we can use ease-out for smoother catchup
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate LngLat
      const lng = lastLocation.current.longitude + (targetLocation.current.longitude - lastLocation.current.longitude) * easeProgress;
      const lat = lastLocation.current.latitude + (targetLocation.current.latitude - lastLocation.current.latitude) * easeProgress;
      
      // Interpolate Heading handling 0/360 wrap
      let h1 = lastLocation.current.heading || 0;
      let h2 = targetLocation.current.heading || 0;
      let diff = h2 - h1;
      
      if (diff > 180) diff -= 360;
      else if (diff < -180) diff += 360;
      
      let newHeading = h1 + diff * easeProgress;
      if (newHeading < 0) newHeading += 360;
      if (newHeading >= 360) newHeading -= 360;

      const interpolated: GPSLocation = {
        ...targetLocation.current,
        longitude: lng,
        latitude: lat,
        heading: newHeading
      };

      onUpdate(interpolated);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [rawLocation, onUpdate]);
};
