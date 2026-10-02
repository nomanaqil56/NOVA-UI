import { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import { searchDestination } from '../../services/geocoding';
import type { GeocodingResult } from '../../types/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface DestinationSearchProps {
  onSelect: (result: GeocodingResult) => void;
}

export const DestinationSearch = ({ onSelect }: DestinationSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const debouncedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    if (debouncedTimeout.current) clearTimeout(debouncedTimeout.current);

    debouncedTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchDestination(query);
      setResults(res);
      setIsSearching(false);
      setShowResults(true);
    }, 500);

    return () => {
      if (debouncedTimeout.current) clearTimeout(debouncedTimeout.current);
    };
  }, [query]);

  const handleSelect = (r: GeocodingResult) => {
    setQuery(r.name);
    setShowResults(false);
    onSelect(r);
  };

  return (
    <div className="relative w-full z-50">
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 relative z-50">
        <Search className="w-5 h-5 text-primary-muted" />
        <input 
          type="text" 
          placeholder="Where do you want to go?" 
          className="bg-transparent border-none outline-none text-primary w-full placeholder:text-primary-muted font-medium"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setShowResults(true); }}
        />
        {isSearching && (
          <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 glass-panel-elevated rounded-2xl border border-border overflow-hidden z-40 shadow-2xl"
          >
            {results.map((r, i) => (
              <div 
                key={i} 
                className="p-4 border-b border-border/50 hover:bg-surface transition-colors cursor-pointer flex gap-3 items-center"
                onClick={() => handleSelect(r)}
              >
                <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-primary">{r.name}</div>
                  <div className="text-xs text-primary-muted line-clamp-1">{r.displayName}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
