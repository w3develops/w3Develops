'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Globe, Clock, CheckCircle2 } from "lucide-react";
import Link from 'next/link';

// Sample major cities and their standard UTC offsets
const cities = [
  { name: "London", offset: 0 },
  { name: "Berlin", offset: 1 },
  { name: "Cairo", offset: 2 },
  { name: "Moscow", offset: 3 },
  { name: "Dubai", offset: 4 },
  { name: "Karachi", offset: 5 },
  { name: "Dhaka", offset: 6 },
  { name: "Bangkok", offset: 7 },
  { name: "Hong Kong", offset: 8 },
  { name: "Tokyo", offset: 9 },
  { name: "Sydney", offset: 11 },
  { name: "Auckland", offset: 13 },
  { name: "Honolulu", offset: -10 },
  { name: "Anchorage", offset: -9 },
  { name: "Los Angeles", offset: -8 },
  { name: "Denver", offset: -7 },
  { name: "Chicago", offset: -6 },
  { name: "New York", offset: -5 },
  { name: "Florida", offset: -4 },
  { name: "Halifax", offset: -4 },
  { name: "Rio de Janeiro", offset: -3 },
  { name: "Azores", offset: -1 },
];

export default function TimeConverterPage() {
  const [search, setSearch] = useState('');
  const [detectedOffset, setDetectedOffset] = useState<number | null>(null);

  useEffect(() => {
    // Detect offset from browser
    const offset = -new Date().getTimezoneOffset() / 60;
    setDetectedOffset(offset);
  }, []);

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10 space-y-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Globe className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">UTC Time Converter</CardTitle>
          <CardDescription>
            Find your UTC offset to help coordinate with the w3Develops global community.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {detectedOffset !== null && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-2">
              <p className="text-sm uppercase tracking-widest text-primary font-bold">Your Detected Offset</p>
              <h2 className="text-5xl font-bold font-headline">UTC {detectedOffset >= 0 ? '+' : ''}{detectedOffset}</h2>
              <div className="flex items-center justify-center gap-2 text-muted-foreground pt-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="text-sm italic">Based on your computer's current clock.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for your city (e.g. Florida, London, Tokyo)..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredCities.map(city => (
                <div key={city.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <span className="font-medium">{city.name}</span>
                  <Badge variant="outline" className="font-mono">
                    UTC {city.offset >= 0 ? '+' : ''}{city.offset}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t text-center">
            <p className="text-muted-foreground mb-4">Ready to join a group?</p>
            <Button asChild variant="secondary">
              <Link href="/signup">Back to Signup</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/30">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Clock className="h-6 w-6 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold">Why do we use UTC?</h4>
              <p className="text-sm text-muted-foreground">
                w3Develops members code from every corner of the planet. UTC (Coordinated Universal Time) provides a neutral "anchor" time so we can schedule meetups without confusing daylight savings or local shifts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
