/** Grey placeholder shapes while the account page loads */
export default function AccountPageSkeleton() {
  const cardPlaceholder = (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <div className="h-6 w-48 bg-muted rounded"></div>
      <div className="h-4 w-64 bg-muted rounded"></div>
      <div className="h-10 mt-4 w-full bg-muted rounded"></div>
      <div className="h-10 w-full bg-muted rounded"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="rounded-full bg-muted h-24 w-24 flex-shrink-0"></div>
        <div className="space-y-2 w-full">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
          <div className="h-4 bg-muted rounded w-80"></div>
          <div className="flex gap-2 pt-2">
            <div className="h-10 w-32 bg-muted rounded-md"></div>
            <div className="h-10 w-32 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="h-6 w-48 bg-muted rounded"></div>
        <div className="h-4 w-64 bg-muted rounded"></div>
        <div className="space-y-4 pt-4">
          <div className="h-16 bg-muted/50 rounded-lg"></div>
          <div className="h-16 bg-muted/50 rounded-lg"></div>
          <div className="h-16 bg-muted/50 rounded-lg"></div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cardPlaceholder}
        {cardPlaceholder}
        {cardPlaceholder}
      </div>
    </div>
  );
}
