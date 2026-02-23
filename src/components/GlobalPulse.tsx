'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { timeAgo } from '@/lib/utils';
import { Zap, Code, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

type PulseItem = {
    id: string;
    type: 'project' | 'group' | 'meetup';
    title: string;
    subtitle: string;
    link: string;
    createdAt: Timestamp;
}

export default function GlobalPulse() {
    const firestore = useFirestore();
    const [items, setItems] = useState<PulseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPulse = async () => {
            setIsLoading(true);
            try {
                const results: PulseItem[] = [];
                
                // Fetch latest projects
                const projectsSnap = await getDocs(query(collection(firestore, 'soloProjects'), orderBy('createdAt', 'desc'), limit(3)));
                projectsSnap.forEach(d => {
                    const data = d.data();
                    results.push({
                        id: d.id,
                        type: 'project',
                        title: data.name,
                        subtitle: `Project by ${data.username}`,
                        link: `/solo-projects`,
                        createdAt: data.createdAt,
                    });
                });

                // Fetch latest groups
                const groupsSnap = await getDocs(query(collection(firestore, 'studyGroups'), orderBy('createdAt', 'desc'), limit(3)));
                groupsSnap.forEach(d => {
                    const data = d.data();
                    results.push({
                        id: d.id,
                        type: 'group',
                        title: data.name,
                        subtitle: `New ${data.topic} group`,
                        link: `/studygroups/${d.id}`,
                        createdAt: data.createdAt,
                    });
                });

                // Fetch latest meetups
                const meetupsSnap = await getDocs(query(collection(firestore, 'meetups'), orderBy('createdAt', 'desc'), limit(3)));
                meetupsSnap.forEach(d => {
                    const data = d.data();
                    results.push({
                        id: d.id,
                        type: 'meetup',
                        title: data.name,
                        subtitle: `Meetup on ${data.topic}`,
                        link: `/meetups/${d.id}`,
                        createdAt: data.createdAt,
                    });
                });

                // Sort by date and take the most recent 6
                results.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis() || 0;
                    const bTime = b.createdAt?.toMillis() || 0;
                    return bTime - aTime;
                });
                
                setItems(results.slice(0, 6));
            } catch (error) {
                console.error("Error fetching global pulse:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPulse();
    }, [firestore]);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (items.length === 0) return null;

    const icons = {
        project: <Code className="h-4 w-4 text-blue-500" />,
        group: <Users className="h-4 w-4 text-green-500" />,
        meetup: <Calendar className="h-4 w-4 text-purple-500" />,
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                Community Pulse
            </h4>
            <div className="space-y-1">
                {items.map(item => (
                    <PulseItemRow key={`${item.type}-${item.id}`} item={item} icon={icons[item.type]} />
                ))}
            </div>
        </div>
    );
}

function PulseItemRow({ item, icon }: { item: PulseItem, icon: React.ReactNode }) {
    const [ago, setAgo] = useState('');

    useEffect(() => {
        // Defer timeAgo to avoid hydration mismatch
        setAgo(timeAgo(item.createdAt));
    }, [item.createdAt]);

    return (
        <Link href={item.link} className="block group">
            <div className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                <div className="mt-1">{icon}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight truncate">
                        {item.subtitle} {ago && `• ${ago}`}
                    </p>
                </div>
            </div>
        </Link>
    );
}
