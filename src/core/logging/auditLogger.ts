import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import apiClient from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuditEntry {
  action: string;
  userId?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  coordinates?: { lat: number; lng: number };
  deviceId: string;
}

const LOG_BUFFER_KEY = 'vuduka_audit_buffer';

class AuditLogger {
  async log(action: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const userId = await SecureStore.getItemAsync('user_id');

    let coordinates: { lat: number; lng: number } | undefined;
    try {
      const loc = await Location.getLastKnownPositionAsync();
      if (loc) coordinates = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch { /* Non-blocking */ }

    const entry: AuditEntry = {
      action,
      userId: userId ?? undefined,
      metadata,
      timestamp: new Date().toISOString(),
      coordinates,
      deviceId: await this.getDeviceId(),
    };

    // Try to flush immediately; buffer if offline
    try {
      await apiClient.post('/audit/log', entry);
    } catch {
      await this.buffer(entry);
    }
  }

  async flushBuffer(): Promise<void> {
    const raw = await AsyncStorage.getItem(LOG_BUFFER_KEY);
    if (!raw) return;
    const entries: AuditEntry[] = JSON.parse(raw);
    try {
      await apiClient.post('/audit/batch', entries);
      await AsyncStorage.removeItem(LOG_BUFFER_KEY);
    } catch { /* Will retry next time */ }
  }

  private async buffer(entry: AuditEntry): Promise<void> {
    const raw = await AsyncStorage.getItem(LOG_BUFFER_KEY);
    const entries: AuditEntry[] = raw ? JSON.parse(raw) : [];
    entries.push(entry);
    await AsyncStorage.setItem(LOG_BUFFER_KEY, JSON.stringify(entries));
  }

  private async getDeviceId(): Promise<string> {
    let id = await SecureStore.getItemAsync('device_id');
    if (!id) {
      id = Math.random().toString(36).slice(2);
      await SecureStore.setItemAsync('device_id', id);
    }
    return id;
  }
}

export const auditLogger = new AuditLogger();