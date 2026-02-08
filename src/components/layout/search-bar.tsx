'use client';

import { FormEvent, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input, type InputProps } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps extends Omit<InputProps, 'query'> {
  query: string;
  onQueryChange: (query: string) => void;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ query, onQueryChange, ...props }, ref) => {
    const router = useRouter();

    const handleSearch = (e: FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
      <form onSubmit={handleSearch} className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={ref}
          type="search"
          placeholder="Search w3Develops"
          className="w-full pl-10"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          {...props}
        />
      </form>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
