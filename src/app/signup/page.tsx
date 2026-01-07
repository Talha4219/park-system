'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Loader2, ParkingSquare, User, Mail, Car, KeyRound, Calendar, Hash, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from '@/components/ui/separator';

const signupSchema = z.object({
  displayName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  carNumber: z.string().min(1, "Car number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  cardNumber: z.string().min(1, "Card number is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  cvc: z.string().min(1, "CVC is required"),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { refresh } = useAuth();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      carNumber: "",
      password: "",
      cardNumber: "",
      expiryDate: "",
      cvc: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to create account.');
      }

      await refresh();
      toast({ title: 'Account Created', description: 'Welcome to ParkSmart!' });
      router.push('/user/dashboard');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full"></div>
      </div>

      <Link href="/login" className="absolute top-10 left-10 transition-transform hover:-translate-x-1">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Login
        </Button>
      </Link>

      <div className="w-full max-w-2xl space-y-8 relative z-10 pt-10 pb-20">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[2rem] bg-white/5 border border-white/10 premium-border shadow-2xl mb-4 group hover:scale-110 transition-transform duration-500">
            <ParkingSquare className="size-8 text-primary group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tight">Create Member Profile</h1>
          <p className="text-muted-foreground text-sm font-medium">Join the premium parking network.</p>
        </div>

        <Card className="glass-card border-white/5 rounded-[2.5rem] p-4 lg:p-8 premium-border overflow-hidden">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary pl-1">Personal Identity</p>
                    <FormField control={form.control} name="displayName" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Full legal Name</Label>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="John Doe" className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20" {...field} />
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Contact Email</Label>
                        <FormControl>
                          <div className="relative">
                            <Input type="email" placeholder="user@example.com" className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20" {...field} />
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="carNumber" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Identification Plate</Label>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="ABC-123" className="h-12 bg-white/5 border-white/10 rounded-xl font-mono focus:ring-primary/20" {...field} />
                            <Car className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary pl-1">Security & Billing</p>
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Secret Password</Label>
                        <FormControl>
                          <div className="relative">
                            <Input type="password" placeholder="••••••••" className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20" {...field} />
                            <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />

                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 gap-4">
                        <FormField control={form.control} name="cardNumber" render={({ field }) => (
                          <FormItem className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Payment Method (Card)</Label>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="•••• •••• •••• ••••" className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20" {...field} />
                                <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 size-4 opacity-30" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold" />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="expiryDate" render={({ field }) => (
                            <FormItem className="space-y-2">
                              <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">Expiry</Label>
                              <FormControl>
                                <div className="relative">
                                  <Input placeholder="MM/YY" className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20" {...field} />
                                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-3 opacity-30" />
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="cvc" render={({ field }) => (
                            <FormItem className="space-y-2">
                              <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">CVC</Label>
                              <FormControl>
                                <div className="relative">
                                  <Input placeholder="123" className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20" {...field} />
                                  <Hash className="absolute right-3 top-1/2 -translate-y-1/2 size-3 opacity-30" />
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold dark:text-white shadow-xl shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 size-5" />}
                    Initialize Premium Account
                  </Button>
                  <p className="text-center text-xs font-medium text-muted-foreground mt-4">
                    Already a member? <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">Authorize Session</Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
