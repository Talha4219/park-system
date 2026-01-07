'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ParkingSquare, User, Shield, ArrowLeft, KeyRound, Mail, Car, LogIn } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const userLoginSchema = z.object({
  carNumber: z.string().min(1, "Car number is required"),
  password: z.string().min(1, "Password is required"),
});

const managerLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingManager, setIsLoadingManager] = useState(false);
  const { refresh } = useAuth();

  const userForm = useForm<z.infer<typeof userLoginSchema>>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: { carNumber: "", password: "" },
  });

  const managerForm = useForm<z.infer<typeof managerLoginSchema>>({
    resolver: zodResolver(managerLoginSchema),
    defaultValues: { email: "manager@parksmart.com", password: "password" },
  });

  const handleUserSubmit = async (values: z.infer<typeof userLoginSchema>) => {
    setIsLoadingUser(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      await refresh();
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/user/dashboard');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleManagerSubmit = async (values: z.infer<typeof managerLoginSchema>) => {
    setIsLoadingManager(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, role: 'manager' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      await refresh();
      toast({ title: 'Manager Login Successful', description: 'Redirecting to dashboard...' });
      router.push('/dashboard');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoadingManager(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full"></div>
      </div>

      <Link href="/" className="absolute top-10 left-10 transition-transform hover:-translate-x-1">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Site
        </Button>
      </Link>

      <div className="w-full max-w-lg space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[2rem] bg-white/5 border border-white/10 premium-border shadow-2xl mb-4 group hover:scale-110 transition-transform duration-500">
            <ParkingSquare className="size-8 text-primary group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tight">Access Terminal</h1>
          <p className="text-muted-foreground text-sm font-medium">Initialize your session to manage or park.</p>
        </div>

        <Card className="glass-card border-white/5 rounded-[2.5rem] p-4 lg:p-4 premium-border overflow-hidden">
          <CardContent className="pt-6">
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-white/5 rounded-2xl h-14">
                <TabsTrigger value="user" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold h-full">
                  <User className="mr-2 size-4" /> User
                </TabsTrigger>
                <TabsTrigger value="manager" className="rounded-xl data-[state=active]:bg-zinc-800 data-[state=active]:text-white font-bold h-full">
                  <Shield className="mr-2 size-4" /> Manager
                </TabsTrigger>
              </TabsList>

              <TabsContent value="user" className="pt-6">
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-5">
                    <FormField control={userForm.control} name="carNumber" render={({ field }) => (
                      <FormItem>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Identification Plate</Label>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="ABC-123" className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono text-lg focus:ring-primary/20" {...field} />
                            <Car className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                    <FormField control={userForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Security Key</Label>
                        <FormControl>
                          <div className="relative">
                            <Input type="password" placeholder="••••••••" className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20" {...field} />
                            <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full h-14 rounded-2xl font-bold dark:text-white shadow-xl shadow-primary/20 mt-2" disabled={isLoadingUser}>
                      {isLoadingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 size-4" />}
                      Authorize User Session
                    </Button>
                    <p className="text-center text-xs font-medium text-muted-foreground">
                      New to the platform? <Link href="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">Create Profile</Link>
                    </p>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="manager" className="pt-6">
                <Form {...managerForm}>
                  <form onSubmit={managerForm.handleSubmit(handleManagerSubmit)} className="space-y-5">
                    <FormField control={managerForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Admin Email</Label>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="admin@parksmart.com" className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20" {...field} />
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                    <FormField control={managerForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Security Key</Label>
                        <FormControl>
                          <div className="relative">
                            <Input type="password" placeholder="••••••••" className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20" {...field} />
                            <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold shadow-xl shadow-black/40 mt-2" disabled={isLoadingManager}>
                      {isLoadingManager ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 size-4" />}
                      Elevate to Manager
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
