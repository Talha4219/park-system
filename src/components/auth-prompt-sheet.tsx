'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface AuthPromptSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuthPromptSheet({ open, onOpenChange }: AuthPromptSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Login Required</SheetTitle>
                    <SheetDescription>
                        You need to be logged in to reserve a parking spot.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                    <div className="rounded-lg border p-4 space-y-3">
                        <h3 className="font-semibold">Already have an account?</h3>
                        <p className="text-sm text-muted-foreground">
                            Sign in to reserve parking spots and manage your reservations.
                        </p>
                        <Link href="/login" className="block">
                            <Button className="w-full" size="lg">
                                <LogIn className="mr-2 h-4 w-4" />
                                Login
                            </Button>
                        </Link>
                    </div>

                    <div className="rounded-lg border p-4 space-y-3">
                        <h3 className="font-semibold">New to ParkSmart?</h3>
                        <p className="text-sm text-muted-foreground">
                            Create an account to start reserving parking spots.
                        </p>
                        <Link href="/signup" className="block">
                            <Button variant="outline" className="w-full" size="lg">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Sign Up
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground text-center">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
