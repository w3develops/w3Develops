
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit, Query } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { StudyGroup, GroupProject, BookClub, Meetup } from '@/lib/types';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface NameSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  collectionPath: 'studyGroups' | 'groupProjects' | 'bookClubs' | 'meetups';
  placeholder: string;
}

type SearchResult = Pick<StudyGroup, 'id' | 'name'> | Pick<GroupProject, 'id' | 'name'> | Pick<BookClub, 'id' | 'name'> | Pick<Meetup, 'id' | 'name'>;

export default function NameSearchInput({ value, onChange, onSelect, collectionPath, placeholder }: NameSearchInputProps) {
  const firestore = useFirestore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(value, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const searchQuery = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return null;
    const lowercasedTerm = debouncedSearchTerm.toLowerCase();
    return query(
      collection(firestore, collectionPath),
      where('name_lowercase', '>=', lowercasedTerm),
      where('name_lowercase', '<=', lowercasedTerm + '\uf8ff'),
      orderBy('name_lowercase'),
      limit(5)
    ) as Query<SearchResult>;
  }, [debouncedSearchTerm, firestore, collectionPath]);

  const { data: suggestions, isLoading } = useCollection<SearchResult>(searchQuery);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleSelect = (name: string) => {
    onSelect(name);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={75}
        required
      />
      {showSuggestions && value.length > 1 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && <div className="p-2 text-sm text-muted-foreground">Searching...</div>}
          {!isLoading && (!suggestions || suggestions.length === 0) && debouncedSearchTerm.length > 1 && (
            <div className="p-2 text-sm text-muted-foreground">No matches found.</div>
          )}
          {suggestions && suggestions.length > 0 && (
            <ul>
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  className="p-2 text-sm hover:bg-accent cursor-pointer"
                  onClick={() => handleSelect(item.name)}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
