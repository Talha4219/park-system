'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ParkingSpot } from '@/lib/types';

interface PaymentReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  spot: ParkingSpot | null;
  onConfirm: () => void;
  durationString: string;
  totalCost: number;
}

const HOURLY_RATE = 5; // $5 per hour

export function PaymentReceiptDialog({ isOpen, onOpenChange, spot, onConfirm, durationString, totalCost }: PaymentReceiptDialogProps) {
  if (!spot || !spot.occupiedBy) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Payment Receipt</DialogTitle>
          <DialogDescription>
            Summary for parking spot {spot.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 my-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">License Plate</span>
            <span className="font-mono font-medium">{spot.occupiedBy.licensePlate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Parking Duration</span>
            <span className="font-medium">{durationString}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Hourly Rate</span>
            <span className="font-medium">${HOURLY_RATE.toFixed(2)} / hour</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-bold">Total Amount Due</span>
            <span className="font-headline font-bold text-primary">${totalCost.toFixed(2)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm Payment & Open Gate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
