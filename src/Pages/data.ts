import type {
  Bus,
  IncidentType,
  SeverityOption,
  FilterOption,
  PayMethodOption,
} from './types';
import { Colors } from './theme';

export const BUSES: Bus[] = [
  {
    id: 'b1',
    number: 'RAC 847 B',
    company: 'Volcano Express',
    from: 'Musanze Terminal',
    eta: '5 min',
    arrivalTime: '08:05',
    seats: 12,
    totalSeats: 30,
    price: '2,800',
    type: 'Express',
    color: '#003DD0',
  },
  {
    id: 'b2',
    number: 'RAE 221 A',
    company: 'Horizon Link',
    from: 'Huye Bus Park',
    eta: '12 min',
    arrivalTime: '08:12',
    seats: 3,
    totalSeats: 25,
    price: '2,200',
    type: 'Standard',
    color: '#0EA5E9',
  },
  {
    id: 'b3',
    number: 'RAB 553 C',
    company: 'City Ride Plus',
    from: 'Nyabugogo Hub',
    eta: '18 min',
    arrivalTime: '08:18',
    seats: 0,
    totalSeats: 30,
    price: '1,800',
    type: 'Economy',
    color: '#8B5CF6',
  },
  {
    id: 'b4',
    number: 'RAD 119 F',
    company: 'Kigali Coach',
    from: 'Pere Stadium',
    eta: '24 min',
    arrivalTime: '08:24',
    seats: 8,
    totalSeats: 45,
    price: '3,500',
    type: 'VIP',
    color: '#D4880A',
  },
  {
    id: 'b5',
    number: 'RAC 672 E',
    company: 'TransRwanda',
    from: 'Remera Stage',
    eta: '31 min',
    arrivalTime: '08:31',
    seats: 15,
    totalSeats: 50,
    price: '1,500',
    type: 'Standard',
    color: '#059669',
  },
];

export const INCIDENT_TYPES: IncidentType[] = [
  { id: 'i1', label: 'Reckless Driving', icon: '⚡' },
  { id: 'i2', label: 'Overloading',      icon: '⚠️' },
  { id: 'i3', label: 'Harassment',       icon: '🚨' },
  { id: 'i4', label: 'Accident',         icon: '💥' },
  { id: 'i5', label: 'Mechanical Fault', icon: '🔧' },
  { id: 'i6', label: 'Other',            icon: '📋' },
];

export const FILTERS: FilterOption[] = [
  { id: 'all',       label: 'All Buses'  },
  { id: 'available', label: 'Available'  },
  { id: 'express',   label: 'Express'    },
  { id: 'vip',       label: 'VIP'        },
];

export const PAY_METHODS: PayMethodOption[] = [
  { id: 'momo',   label: 'MTN MoMo',    emoji: '📱', color: Colors.amber },
  { id: 'airtel', label: 'Airtel Money', emoji: '💳', color: Colors.red   },
];

export const SEVERITIES: SeverityOption[] = [
  {
    id: 'low',
    label: 'Low',
    activeColor: Colors.green,
    activeBg: Colors.greenLight,
  },
  {
    id: 'medium',
    label: 'Medium',
    activeColor: Colors.amberDark,
    activeBg: Colors.amberLight,
  },
  {
    id: 'high',
    label: 'High',
    activeColor: Colors.red,
    activeBg: Colors.redLight,
  },
];