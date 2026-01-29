import { Accessibility, BatteryCharging, Car, Ban, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParkingSpot as ParkingSpotType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface ParkingSpotProps {
  spot: ParkingSpotType;
  onClick: () => void;
  isRemoveMode?: boolean;
  onRemoveClick?: () => void;
}

const spotIcons = {
  regular: Car,
  accessible: Accessibility,
  ev: BatteryCharging,
};

export function ParkingSpot({ spot, onClick, isRemoveMode = false, onRemoveClick = () => { } }: ParkingSpotProps) {
  const Icon = spotIcons[spot.type];

  const spotStyles = {
    available: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:border-emerald-500/40 hover:from-emerald-500/20 hover:to-emerald-500/10 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]',
    'in-use': 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:border-blue-500/40 hover:from-blue-500/20 hover:to-blue-500/10',
    booked: 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:border-amber-500/40 hover:from-amber-500/20 hover:to-amber-500/10',
    unavailable: 'border-zinc-800 bg-zinc-900/40 text-zinc-600 opacity-60 grayscale',
  };

  const statusColors = {
    available: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'in-use': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    booked: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    unavailable: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
  };

  const isDisabled = spot.status === 'unavailable' || (spot.status === 'in-use' && !isRemoveMode) || (spot.status === 'booked' && !isRemoveMode);

  return (
    <div className="relative group perspective-1000">
      <Button
        variant="ghost"
        className={cn(
          'h-36 w-full flex-col p-0 justify-between items-stretch relative transition-all duration-500 ease-out border backdrop-blur-md overflow-hidden rounded-2xl group/btn',
          spotStyles[spot.status],
          !isDisabled && 'hover:-translate-y-1 hover:shadow-2xl'
        )}
        onClick={onClick}
        disabled={isDisabled}
      >
        {/* Status Indicator Bar */}
        <div className={cn(
          "absolute top-0 left-0 w-1 h-full transition-all duration-300",
          spot.status === 'available' ? 'bg-emerald-500' :
            spot.status === 'in-use' ? 'bg-blue-500' :
              spot.status === 'booked' ? 'bg-amber-500' : 'bg-zinc-700'
        )} />

        <div className="p-4 flex flex-col justify-between h-full w-full pl-5">
          <div className="flex justify-between items-start">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold opacity-70">Unit</span>
              <span className="text-2xl font-headline font-bold leading-none tracking-tight">{spot.id.split('-')[1]}</span>
            </div>
            <div className={cn("p-2 rounded-lg border shadow-sm backdrop-blur-sm", statusColors[spot.status])}>
              <Icon className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            {spot.status === 'in-use' && spot.occupiedBy ? (
              <div className="flex flex-col items-start">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Occupant</span>
                <p className="font-mono text-sm font-bold tracking-tight text-foreground truncate w-full text-left">
                  {spot.occupiedBy.licensePlate}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  spot.status === 'available' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" :
                    spot.status === 'booked' ? "bg-amber-400" :
                      "bg-zinc-600"
                )} />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  spot.status === 'available' ? "text-emerald-400" :
                    spot.status === 'booked' ? "text-amber-400" :
                      "text-zinc-500"
                )}>
                  {spot.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ambient Glow for Available Spots */}
        {spot.status === 'available' && (
          <div className="absolute inset-0 bg-emerald-400/5 blur-xl rounded-2xl -z-10 group-hover:bg-emerald-400/10 transition-colors duration-500" />
        )}
      </Button>

      {isRemoveMode && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full z-20 shadow-xl border border-white/20 transition-transform hover:scale-110">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Spot?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete spot <strong className="text-foreground">{spot.id}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRemoveClick} className="bg-destructive hover:bg-destructive/90 text-white">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
