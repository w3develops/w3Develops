'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Copy, ExternalLink, Heart } from 'lucide-react';
import Link from 'next/link';

interface CryptoAddress {
    name: string;
    address: string;
    protocol?: string;
}

const cryptoAddresses: CryptoAddress[] = [
    {
        name: 'Bitcoin',
        address: 'bc1qppjzq8lsd753zat3pn5jy7c6e0fpwwvugpy89l',
        protocol: 'Native Segwit',
    },
    {
        name: 'Ethereum',
        address: '0x00C5D793627c8DCDF2ECbA6382048A2CEEe5D5ED',
    },
    {
        name: 'Solana',
        address: '4abvxRwWukzMUNrgk6kzwt7KhfAXUDYVKj45FEn6EW1k',
    },
];

export default function DonatePage() {
    const { toast } = useToast();

    const handleCopy = (address: string) => {
        navigator.clipboard.writeText(address).then(() => {
            toast({
                title: "Copied to clipboard!",
                description: "The address has been copied successfully.",
            });
        }).catch(err => {
            toast({
                variant: "destructive",
                title: "Failed to copy",
                description: "Could not copy address to clipboard.",
            });
        });
    };

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-10">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Donate to w3Develops</CardTitle>
                    <CardDescription>
                        Your contributions help us grow our community and continue to provide free learning resources and collaborative opportunities for developers worldwide.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-center">Support us on your favorite platform</h3>
                        <div className="space-y-4">
                            <Button asChild size="lg" className="h-auto py-4 w-full">
                                <Link href="https://www.paypal.com/pool/9m8XofK5YA?sr=wccr" target="_blank" rel="noopener noreferrer">
                                    <div className="flex flex-col items-center gap-2">
                                        <Heart className="w-6 h-6" />
                                        <span className="font-bold">Donate via PayPal Pool</span>
                                    </div>
                                </Link>
                            </Button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Button asChild size="lg" className="h-auto py-4">
                                    <Link href="https://www.patreon.com/c/w3develops" target="_blank" rel="noopener noreferrer">
                                        <div className="flex flex-col items-center gap-2">
                                            <Heart className="w-6 h-6" />
                                            <span className="font-bold">Support on Patreon</span>
                                        </div>
                                    </Link>
                                </Button>
                                <Button asChild size="lg" className="h-auto py-4">
                                    <Link href="https://opencollective.com/w3develops" target="_blank" rel="noopener noreferrer">
                                        <div className="flex flex-col items-center gap-2">
                                            <Heart className="w-6 h-6" />
                                            <span className="font-bold">Donate via Open Collective</span>
                                        </div>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-center">Or donate via cryptocurrency</h3>
                        {cryptoAddresses.map((crypto) => (
                            <div key={crypto.name}>
                                <h4 className="text-md font-semibold mb-2">{crypto.name} {crypto.protocol && `(${crypto.protocol})`}</h4>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="text" 
                                        readOnly 
                                        value={crypto.address} 
                                        className="font-mono text-sm bg-muted"
                                    />
                                    <Button variant="outline" size="icon" onClick={() => handleCopy(crypto.address)}>
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy {crypto.name} address</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-center">Other Methods</h3>
                         <div>
                            <h4 className="text-md font-semibold mb-2">Zelle</h4>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="text" 
                                    readOnly 
                                    value="4156102648" 
                                    className="font-mono text-sm bg-muted"
                                />
                                <Button variant="outline" size="icon" onClick={() => handleCopy('4156102648')}>
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy Zelle phone number</span>
                                </Button>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-md font-semibold mb-2">Cash App</h4>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="text" 
                                    readOnly 
                                    value="$LearnToCode" 
                                    className="font-mono text-sm bg-muted"
                                />
                                <Button variant="outline" size="icon" onClick={() => handleCopy('$LearnToCode')}>
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy Cash App username</span>
                                </Button>
                            </div>
                        </div>
                         <div>
                            <h4 className="text-md font-semibold mb-2">Chime</h4>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="text" 
                                    readOnly 
                                    value="$LearnToCode" 
                                    className="font-mono text-sm bg-muted"
                                />
                                <Button variant="outline" size="icon" onClick={() => handleCopy('$LearnToCode')}>
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy Chime username</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 text-sm text-muted-foreground">
                        <p><strong>Disclaimer:</strong> Please ensure you are sending the correct cryptocurrency to the correct address. Transactions are irreversible. Thank you for your generosity!</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
