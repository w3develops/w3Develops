import type { ReactNode } from 'react';

/** A loading bar, an empty message, or a divided list, for the account page cards */
export default function ItemList<T extends { id: string }>({ items, isLoading, empty, renderItem, itemClassName = 'py-2' }: {
  items: T[] | null;
  isLoading: boolean;
  empty: ReactNode;
  renderItem: (item: T) => ReactNode;
  itemClassName?: string;
}) {
  if (isLoading) return <div className="h-10 w-full bg-muted rounded animate-pulse"></div>;
  if (!items || items.length === 0) return <>{empty}</>;
  return (
    <ul className="divide-y">
      {items.map(item => <li key={item.id} className={itemClassName}>{renderItem(item)}</li>)}
    </ul>
  );
}
