'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const addSpotSchema = z.object({
    zoneId: z.string().min(1, 'Zone is required'),
    type: z.enum(['regular', 'accessible', 'ev'], {
        required_error: 'Spot type is required',
    }),
});

type AddSpotFormValues = z.infer<typeof addSpotSchema>;

interface AddSpotDialogProps {
    onSpotAdded: () => void;
    onError: (message: string) => void;
}

export function AddSpotDialog({ onSpotAdded, onError }: AddSpotDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AddSpotFormValues>({
        resolver: zodResolver(addSpotSchema),
        defaultValues: {
            zoneId: 'A',
            type: 'regular',
        },
    });

    const onSubmit = async (values: AddSpotFormValues) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/parking-spots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Could not add new spot.');
            }

            setOpen(false);
            form.reset();
            onSpotAdded();
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Could not add new spot.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add a Spot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Parking Spot</DialogTitle>
                    <DialogDescription>
                        Configure the new parking spot details. The spot number will be assigned automatically.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="zoneId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zone</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a zone" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="A">Zone A</SelectItem>
                                            <SelectItem value="B">Zone B</SelectItem>
                                            <SelectItem value="C">Zone C</SelectItem>
                                            <SelectItem value="D">Zone D</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Spot Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="regular" id="regular" />
                                                <Label htmlFor="regular" className="font-normal cursor-pointer">
                                                    Regular Parking
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="accessible" id="accessible" />
                                                <Label htmlFor="accessible" className="font-normal cursor-pointer">
                                                    Accessible Parking
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="ev" id="ev" />
                                                <Label htmlFor="ev" className="font-normal cursor-pointer">
                                                    EV Charging Station
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Adding...' : 'Add Spot'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
