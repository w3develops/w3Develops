
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";

export default function ChatPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/chat');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return (
          <div className="p-4 md:p-10">
            <LoadingSkeleton />
          </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle>Community Chat</CardTitle>
                    <CardDescription>
                        Join the conversation on our official Discord server.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-[350/500] w-full">
                        <iframe 
                            src="https://discord.com/widget?id=460675192037834752&theme=dark" 
                            width="100%" 
                            height="100%" 
                            allowTransparency={true} 
                            frameBorder="0" 
                            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                        ></iframe>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
