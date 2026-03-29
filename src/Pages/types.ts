export type BusType = 'Express' | 'Standard' | 'Economy' | 'VIP';
export type PayStep = 'details' | 'confirm' | 'success';
export type PayMethod = 'momo' | 'airtel';
export type SeverityLevel = 'low' | 'medium' | 'high';
export type FilterKey = 'all' | 'available' | 'express' | 'vip';
export type RootStackParamList = {
  Discover: undefined;
  Incident: undefined;
};

export type HomeTabParamList = {
  Home: undefined;
  Discover: undefined;
  Incident: undefined;
};

export interface Bus {
  id: string;
  number: string;
  company: string;
  from: string;
  eta: string;
  arrivalTime: string;
  seats: number;
  totalSeats: number;
  price: string;
  type: BusType;
  color: string;
}

export interface IncidentType {
  id: string;
  label: string;
  icon: string;
}

export interface SeverityOption {
  id: SeverityLevel;
  label: string;
  activeColor: string;
  activeBg: string;
}

export interface FilterOption {
  id: FilterKey;
  label: string;
}

export interface PayMethodOption {
  id: PayMethod;
  label: string;
  emoji: string;
  color: string;
}