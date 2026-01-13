import Dexie, { Table } from 'dexie';

export interface DraftIntent {
  id: string;
  projectId: string;
  name: string;
  schema: any;
  sampleInput?: any;
  syncStatus: 'pending' | 'synced' | 'conflict';
  updatedAt: number;
}

export interface PendingOperation {
  id?: number;
  type: 'create' | 'update' | 'delete' | 'forge' | 'execute';
  endpoint: string;
  method: string;
  payload: any;
  createdAt: number;
}

export class PrompetheusDB extends Dexie {
  drafts!: Table<DraftIntent>;
  pendingOperations!: Table<PendingOperation>;

  constructor() {
    super('promptetheus-offline');
    this.version(1).stores({
      drafts: 'id, projectId, syncStatus, updatedAt',
      pendingOperations: '++id, type, createdAt',
    });
  }
}

export const db = new PrompetheusDB();
