export type ParkingSpotType = 'regular' | 'accessible' | 'ev';

export type ParkingSpotStatus = 'available' | 'in-use' | 'unavailable' | 'booked';

export interface OccupiedDetails {
  licensePlate: string;
  startTime: string; // ISO string
  isPaid?: boolean;
  isAtExit?: boolean;
  totalBill?: number;
}

export interface ReservationDetails {
  userId: string;
  carNumber: string;
  phoneNumber: string;
  reservedAt: string; // ISO string
}

export interface ParkingSpot {
  id: string;
  spotNumber: number;
  type: ParkingSpotType;
  status: ParkingSpotStatus;
  occupiedBy?: OccupiedDetails;
  reservedBy?: ReservationDetails;
}

export interface ParkingZone {
  id: string;
  name: string;
  spots: ParkingSpot[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  carNumber: string;
  role: 'user' | 'manager';
}

export interface ParkingHistory {
  _id?: string;
  userId: string;
  carNumber: string;
  spotId: string;
  spotType: ParkingSpotType;
  startTime: string;
  endTime: string;
  totalCost: number;
  duration: string;
}
