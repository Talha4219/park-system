import type { ParkingZone, ParkingSpot as ParkingSpotType } from '@/lib/types';
import { ParkingSpot } from '@/components/parking-spot';
import { Badge } from './ui/badge';
import { Map } from 'lucide-react';

interface ParkingMapProps {
  zones: ParkingZone[];
  onSpotClick: (spot: ParkingSpotType) => void;
  isRemoveMode?: boolean;
  onRemoveClick?: (spotId: string) => void;
}

export function ParkingMap({ zones, onSpotClick, isRemoveMode = false, onRemoveClick = () => { } }: ParkingMapProps) {
  return (
    <div className="space-y-12">
      {zones.map(zone => {
        const availableCount = zone.spots.filter(s => s.status === 'available').length;

        return (
          <div key={zone.id} className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Map className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-headline font-bold tracking-tight">{zone.name}</h2>
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                    <span className="text-emerald-500">{availableCount} Available</span> / {zone.spots.length} Total
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="rounded-full px-3 py-1 border-white/10 text-[10px] uppercase font-bold tracking-widest bg-white/5">
                {zone.id}
              </Badge>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
              {zone.spots.map(spot => (
                <ParkingSpot
                  key={spot.id}
                  spot={spot}
                  onClick={() => onSpotClick(spot)}
                  isRemoveMode={isRemoveMode}
                  onRemoveClick={() => onRemoveClick(spot.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
