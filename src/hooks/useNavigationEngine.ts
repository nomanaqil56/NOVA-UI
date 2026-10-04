import { useRef, useEffect } from 'react';
import type { GPSLocation } from '../types/navigation';

export const useNavigationEngine = (
  rawLocation: GPSLocation | null,
  onUpdate: (location: GPSLocation) => void
) => {
  const lastLocation = useRef<GPSLocation | null>(null);
  const targetLocation = useRef<GPSLocation | null>(null);
  const currentVisualLocation = useRef<GPSLocation | null>(null);
  
  const startTime = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);
  const currentDuration = useRef<number>(1000);
  const animationFrame = useRef<number>(0);

  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!rawLocation) return;
    const now = performance.now();

    if (!lastLocation.current || !targetLocation.current) {
      // First fix
      lastLocation.current = rawLocation;
      targetLocation.current = rawLocation;
      currentVisualLocation.current = rawLocation;
      lastUpdateTime.current = now;
      onUpdateRef.current(rawLocation);
      return;
    }

    const delta = now - lastUpdateTime.current;
    if (delta > 0) {
      currentDuration.current = Math.max(500, Math.min(3000, delta));
    }
    lastUpdateTime.current = now;

    const startLoc = currentVisualLocation.current || targetLocation.current;
    
    if (startLoc) {
      const R = 6371e3;
      const p1 = startLoc.latitude * Math.PI/180;
      const p2 = rawLocation.latitude * Math.PI/180;
      const dp = (rawLocation.latitude - startLoc.latitude) * Math.PI/180;
      const dl = (rawLocation.longitude - startLoc.longitude) * Math.PI/180;
      const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      if (distance > 100) {
        lastLocation.current = rawLocation;
        targetLocation.current = rawLocation;
        currentVisualLocation.current = rawLocation;
        lastUpdateTime.current = now;
        onUpdateRef.current(rawLocation);
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        return;
      }
    }

    // Start from wherever the animation ACTUALLY is right now, not where it was supposed to finish.
    lastLocation.current = startLoc; 
    targetLocation.current = rawLocation;
    startTime.current = now;

    const animate = (time: number) => {
      if (!lastLocation.current || !targetLocation.current) return;
      
      let progress = (time - startTime.current) / currentDuration.current;
      if (progress > 1) progress = 1;

      const easeProgress = progress; // Linear for velocity consistency

      const lng = lastLocation.current.longitude + (targetLocation.current.longitude - lastLocation.current.longitude) * easeProgress;
      const lat = lastLocation.current.latitude + (targetLocation.current.latitude - lastLocation.current.latitude) * easeProgress;
      
      let h1 = lastLocation.current.heading ?? 0;
      let h2 = targetLocation.current.heading ?? 0;
      
      // Only interpolate if both headings are valid numbers
      let newHeading = h2;
      if (lastLocation.current.heading !== null && targetLocation.current.heading !== null) {
        let diff = h2 - h1;
        if (diff > 180) diff -= 360;
        else if (diff < -180) diff += 360;
        
        newHeading = h1 + diff * easeProgress;
        if (newHeading < 0) newHeading += 360;
        if (newHeading >= 360) newHeading -= 360;
      } else if (targetLocation.current.heading === null) {
        newHeading = h1; // Keep last known heading if null
      }

      const interpolated: GPSLocation = {
        ...targetLocation.current,
        longitude: lng,
        latitude: lat,
        heading: targetLocation.current.heading === null ? null : newHeading
      };

      currentVisualLocation.current = interpolated;
      onUpdateRef.current(interpolated);

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
  }, [rawLocation]); // Removed onUpdate from dependencies
};
