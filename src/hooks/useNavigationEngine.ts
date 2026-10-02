import { useRef, useEffect } from 'react';
import type { GPSLocation } from '../types/navigation';

export const useNavigationEngine = (
  rawLocation: GPSLocation | null,
  onUpdate: (location: GPSLocation) => void
) => {
  const lastLocation = useRef<GPSLocation | null>(null);
  const targetLocation = useRef<GPSLocation | null>(null);
  const startTime = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);
  const currentDuration = useRef<number>(1000);
  const animationFrame = useRef<number>(0);

  useEffect(() => {
    if (!rawLocation) return;
    const now = performance.now();

    if (!lastLocation.current || !targetLocation.current) {
      // First fix
      lastLocation.current = rawLocation;
      targetLocation.current = rawLocation;
      lastUpdateTime.current = now;
      onUpdate(rawLocation);
      return;
    }

    // Calculate dynamic duration based on actual update rate
    const delta = now - lastUpdateTime.current;
    if (delta > 0) {
      // Clamp between 500ms and 3000ms to handle temporary pauses/fast updates
      currentDuration.current = Math.max(500, Math.min(3000, delta));
    }
    lastUpdateTime.current = now;

    // We start from WHEREVER the animation currently interpolated to!
    // But since we don't store intermediate state, we can just start from targetLocation 
    // which the PREVIOUS animation reached (or almost reached).
    lastLocation.current = targetLocation.current; 
    targetLocation.current = rawLocation;
    startTime.current = now;

    const animate = (time: number) => {
      if (!lastLocation.current || !targetLocation.current) return;
      
      let progress = (time - startTime.current) / currentDuration.current;
      if (progress > 1) progress = 1;

      // Linear easing is mathematically required for constant vehicle velocity between ticks.
      // Rubber-banding (ease-in-out) makes the vehicle look like it's braking and accelerating every 1s.
      const easeProgress = progress;

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
