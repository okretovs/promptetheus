import { db, PendingOperation } from './db';
import api from './api';

export class SyncService {
  private syncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  // Start automatic sync every 30 seconds when online
  startAutoSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingOperations();
      }
    }, 30000); // 30 seconds

    // Also sync when coming back online
    window.addEventListener('online', () => {
      this.syncPendingOperations();
    });
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Add operation to sync queue
  async queueOperation(operation: Omit<PendingOperation, 'id' | 'createdAt'>) {
    await db.pendingOperations.add({
      ...operation,
      createdAt: Date.now(),
    });
  }

  // Sync all pending operations
  async syncPendingOperations(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    if (this.syncing) {
      return { synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    if (!navigator.onLine) {
      return { synced: 0, failed: 0, errors: ['Device is offline'] };
    }

    this.syncing = true;
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const operations = await db.pendingOperations
        .orderBy('createdAt')
        .toArray();

      for (const operation of operations) {
        try {
          // Execute the operation
          await this.executeOperation(operation);

          // Remove from queue on success
          await db.pendingOperations.delete(operation.id!);
          synced++;
        } catch (error: any) {
          failed++;
          errors.push(`${operation.type} failed: ${error.message}`);

          // Don't retry if it's a 4xx error (client error)
          if (error.response?.status >= 400 && error.response?.status < 500) {
            await db.pendingOperations.delete(operation.id!);
          }
        }
      }
    } finally {
      this.syncing = false;
    }

    return { synced, failed, errors };
  }

  private async executeOperation(operation: PendingOperation): Promise<void> {
    const { method, endpoint, payload } = operation;

    switch (method.toUpperCase()) {
      case 'GET':
        await api.get(endpoint);
        break;
      case 'POST':
        await api.post(endpoint, payload);
        break;
      case 'PUT':
        await api.put(endpoint, payload);
        break;
      case 'DELETE':
        await api.delete(endpoint);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  // Get pending operation count
  async getPendingCount(): Promise<number> {
    return await db.pendingOperations.count();
  }

  // Clear all pending operations (use with caution)
  async clearAll(): Promise<void> {
    await db.pendingOperations.clear();
  }
}

export const syncService = new SyncService();
