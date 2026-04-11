import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from '../api/apiClient';
import { auditLogger } from '../logging/auditLogger';

interface QueuedAction {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'vuduka_offline_queue';
const MAX_RETRIES = 5;

class OfflineQueue {
  async enqueue(action: Omit<QueuedAction, 'id' | 'retries'>): Promise<void> {
    const queue = await this.getQueue();
    queue.push({ ...action, id: Date.now().toString(), retries: 0 });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    await auditLogger.log('ACTION_QUEUED_OFFLINE', { endpoint: action.endpoint });
  }

  async sync(): Promise<void> {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    const remaining: QueuedAction[] = [];

    for (const action of queue) {
      try {
        await apiClient({ method: action.method, url: action.endpoint, data: action.payload });
        await auditLogger.log('OFFLINE_ACTION_SYNCED', { id: action.id });
      } catch {
        if (action.retries < MAX_RETRIES) {
          remaining.push({ ...action, retries: action.retries + 1 });
        } else {
          await auditLogger.log('OFFLINE_ACTION_ABANDONED', { id: action.id });
        }
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }

  private async getQueue(): Promise<QueuedAction[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export const offlineQueue = new OfflineQueue();