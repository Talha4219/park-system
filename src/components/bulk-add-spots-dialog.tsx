'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers } from 'lucide-react';

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
    FormDescription,
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
import { Input } from '@/components/ui/input';

const bulkAddSchema = z.object({
    zoneId: z.string().min(1, 'Zone is required'),
    type: z.enum(['regular', 'accessible', 'ev'], {
        required_error: 'Spot type is required',
    }),
    quantity: z.coerce
        .number()
        .min(1, 'Must add at least 1 spot')
        .max(50, 'Cannot add more than 50 spots at once'),
});

type BulkAddFormValues = z.infer<typeof bulkAddSchema>;

interface BulkAddSpotsDialogProps {
    onSpotsAdded: (count: number) => void;
    onError: (message: string) => void;
}

export function BulkAddSpotsDialog({ onSpotsAdded, onError }: BulkAddSpotsDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BulkAddFormValues>({
        resolver: zodResolver(bulkAddSchema),
        defaultValues: {
            zoneId: 'A',
            type: 'regular',
            quantity: 5,
        },
    });

    const watchedValues = form.watch();

    const onSubmit = async (values: BulkAddFormValues) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/parking-spots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Could not add spots.');
            }

            const data = await res.json();
            setOpen(false);
            form.reset();
            onSpotsAdded(data.count || values.quantity);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Could not add spots.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'regular':
                return 'regular';
            case 'accessible':
                return 'accessible';
            case 'ev':
                return 'EV charging';
            default:
                return type;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Layers className="mr-2 h-4 w-4" />
                    Bulk Add Spots
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Add Parking Spots</DialogTitle>
                    <DialogDescription>
                        Create multiple parking spots at once. Spot numbers will be assigned automatically.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Spots</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={50}
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Add between 1 and 50 spots at once
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                                <RadioGroupItem value="regular" id="bulk-regular" />
                                                <Label htmlFor="bulk-regular" className="font-normal cursor-pointer">
                                                    Regular Parking
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="accessible" id="bulk-accessible" />
                                                <Label htmlFor="bulk-accessible" className="font-normal cursor-pointer">
                                                    Accessible Parking
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="ev" id="bulk-ev" />
                                                <Label htmlFor="bulk-ev" className="font-normal cursor-pointer">
                                                    EV Charging Station
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm text-muted-foreground">
                                <strong>Preview:</strong> Will create{' '}
                                <strong className="text-foreground">{watchedValues.quantity || 0}</strong>{' '}
                                {getTypeLabel(watchedValues.type)} spot{watchedValues.quantity !== 1 ? 's' : ''} in{' '}
                                <strong className="text-foreground">Zone {watchedValues.zoneId}</strong>
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : `Create ${watchedValues.quantity || 0} Spot${watchedValues.quantity !== 1 ? 's' : ''}`}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
