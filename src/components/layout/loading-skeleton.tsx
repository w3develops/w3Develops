'use client';

export function LoadingSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-card border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                        <div className="hidden md:block h-10 w-64 bg-muted rounded-md animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-6">
                            <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
                            <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
                        </div>
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8 animate-pulse">
                    <div className="h-10 bg-muted rounded w-1/3"></div>
                    <div className="space-y-4">
                        <div className="h-20 bg-muted rounded-lg w-full"></div>
                        <div className="h-40 bg-muted rounded-lg w-full"></div>
                    </div>
                </div>
            </main>
            <footer className="bg-card border-t py-6">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
                    <div className="flex justify-center gap-4 mt-3">
                       <div className="h-4 w-16 bg-muted rounded"></div>
                       <div className="h-4 w-24 bg-muted rounded"></div>
                       <div className="h-4 w-16 bg-muted rounded"></div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
