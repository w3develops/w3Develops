'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchBar from './search-bar';
import { useRouter } from 'next/navigation';
import { doc, DocumentReference, serverTimestamp, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import NotificationBell from '@/components/notifications/NotificationBell';
import Sidebar from './sidebar';
import { useToast } from '../ui/use-toast';


export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    if (!user) return;
    
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        // We do not await this, to make logout feel faster.
        updateDoc(userDocRef, { lastLogoutAt: serverTimestamp() });

        await auth.signOut();
        router.push('/');
    } catch (error) {
        console.error("Error signing out: ", error);
        toast({
            variant: "destructive",
            title: "Logout Failed",
            description: "An error occurred while signing out. Please try again.",
        })
    }
  };

  useEffect(() => {
    if (isMobileSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;
  
  const username = userProfile?.username || user?.email;
  const avatarFallback = userProfile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase();

  return (
    <header className="bg-[#212529] border-b border-border/5 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-12 md:h-14">
        <div className="flex items-center gap-2 md:gap-4">
          <div className={`flex items-center gap-2 ${isMobileSearchOpen ? 'hidden' : 'flex'}`}>
            <Link href={user ? "/account" : "/"} className="flex items-center gap-2 font-semibold text-lg text-white">
              <Image src="/logo.png" alt="w3Develops Logo" width={32} height={32} className="rounded-full" priority />
            </Link>
            <div className="md:hidden">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(true)} className="text-white hover:text-white/80">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
            </div>
          </div>
          
          <div className="hidden md:block">
             <SearchBar 
              query={searchQuery}
              onQueryChange={setSearchQuery}
            />
          </div>
        </div>

        {isMobileSearchOpen && (
          <div className="md:hidden absolute inset-0 bg-[#212529] flex items-center px-4 h-12 border-b border-border/5">
            <SearchBar 
              ref={searchInputRef}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onBlur={() => setIsMobileSearchOpen(false)}
            />
          </div>
        )}
        
        <div className={`flex items-center gap-2 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
          {isLoading ? (
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          ) : user ? (
            <>
              <Sidebar />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.profilePictureUrl || user.photoURL || ''} alt={userProfile?.username || ''} />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/account">Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href={`/users/${user.uid}`}>Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Sidebar />
              <Button asChild size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
