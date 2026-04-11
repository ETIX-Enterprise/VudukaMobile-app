import * as Location from 'expo-location';
import { auditLogger } from '../logging/auditLogger';

interface LocationEvent {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude: number | null;
  speed: number | null;
}

class LocationService {
  private subscription: Location.LocationSubscription | null = null;
  private lastLocation: LocationEvent | null = null;
  private readonly MAX_SPEED_MS = 44; // ~160 km/h, max plausible bus speed

  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    const bg = await Location.requestBackgroundPermissionsAsync();
    return bg.status === 'granted';
  }

  async startTracking(onLocation: (loc: LocationEvent) => void): Promise<void> {
    const granted = await this.requestPermission();
    if (!granted) throw new Error('Location permission denied');

    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,   // Every 5 seconds
        distanceInterval: 20, // Or every 20 meters
      },
      async (raw) => {
        const event: LocationEvent = {
          latitude: raw.coords.latitude,
          longitude: raw.coords.longitude,
          accuracy: raw.coords.accuracy ?? 0,
          timestamp: raw.timestamp,
          altitude: raw.coords.altitude,
          speed: raw.coords.speed,
        };

        // Spoofing detection: impossible speed jump
        if (this.lastLocation && !this.isPlausible(event)) {
          await auditLogger.log('GPS_SPOOF_DETECTED', {
            previous: this.lastLocation,
            received: event,
          });
          return; // Drop the spoofed point
        }

        // Reject low-accuracy readings
        if (event.accuracy > 50) return;

        this.lastLocation = event;
        onLocation(event);
      }
    );
  }

  private isPlausible(event: LocationEvent): boolean {
    if (!this.lastLocation) return true;
    const dt = (event.timestamp - this.lastLocation.timestamp) / 1000; // seconds
    const dist = this.haversine(
      this.lastLocation.latitude, this.lastLocation.longitude,
      event.latitude, event.longitude
    );
    const speed = dist / dt; // m/s
    return speed <= this.MAX_SPEED_MS;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  stopTracking(): void {
    this.subscription?.remove();
    this.subscription = null;
  }
}

export const locationService = new LocationService();