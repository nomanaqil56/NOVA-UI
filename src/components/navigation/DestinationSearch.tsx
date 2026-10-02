import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, Map, Navigation, X } from 'lucide-react';
import { searchDestination } from '../../services/geocoding';
import type { GeocodingResult, GPSLocation } from '../../types/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface DestinationSearchProps {
  currentLocation: GPSLocation | null;
  onSelect: (result: GeocodingResult) => void;
}

export const DestinationSearch = ({ currentLocation, onSelect }: DestinationSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const debouncedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(false);
      return;
    }

    if (debouncedTimeout.current) clearTimeout(debouncedTimeout.current);

    debouncedTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      setError(false);
      try {
        const res = await searchDestination(query, currentLocation);
        setResults(res);
        setShowResults(true);
      } catch (err) {
        setError(true);
      } finally {
        setIsSearching(false);
      }
    }, 300); // More responsive debounce

    return () => {
      if (debouncedTimeout.current) clearTimeout(debouncedTimeout.current);
    };
  }, [query, currentLocation]);

  const handleSelect = (r: GeocodingResult) => {
    setQuery(r.name);
    setShowResults(false);
    setSelectedIndex(-1);
    onSelect(r);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const getIconForType = (type?: string) => {
    if (type === 'city' || type === 'administrative') return <Building2 className="w-4 h-4 text-accent" />;
    if (type === 'road' || type === 'highway') return <Navigation className="w-4 h-4 text-accent" />;
    return <MapPin className="w-4 h-4 text-accent" />;
  };

  return (
    <div className="relative w-full z-50" ref={searchContainerRef}>
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 relative z-50 border border-border/50 focus-within:border-accent/50 focus-within:shadow-[0_0_15px_rgba(0,210,255,0.2)] transition-all">
        <Search className="w-5 h-5 text-primary-muted" />
        <input 
          type="text" 
          placeholder="Where do you want to go?" 
          className="bg-transparent border-none outline-none text-primary w-full placeholder:text-primary-muted font-medium"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => { if(results.length > 0) setShowResults(true); }}
          onKeyDown={handleKeyDown}
        />
        {isSearching ? (
          <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        ) : query.length > 0 ? (
          <button onClick={() => { setQuery(''); setResults([]); }} className="text-primary-muted hover:text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {showResults && query.length >= 2 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-panel-elevated rounded-2xl border border-border overflow-hidden z-40 shadow-2xl"
          >
            {error ? (
              <div className="p-4 text-sm text-red-400 font-medium text-center">
                SEARCH UNAVAILABLE
              </div>
            ) : results.length === 0 && !isSearching ? (
              <div className="p-4 text-sm text-primary-muted font-medium text-center">
                NO DESTINATIONS FOUND<br/>
                <span className="text-xs opacity-70">Try a broader search</span>
              </div>
            ) : (
              results.map((r, i) => (
                <div 
                  key={r.placeId || i} 
                  className={cn(
                    "p-4 border-b border-border/50 transition-colors cursor-pointer flex gap-3 items-center",
                    selectedIndex === i ? "bg-accent/10" : "hover:bg-surface"
                  )}
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                    {getIconForType(r.type)}
                  </div>
                  <div>
                    <div className="font-semibold text-primary">{r.name}</div>
                    <div className="text-xs text-primary-muted line-clamp-1">{r.displayName}</div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
