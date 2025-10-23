import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { JournalEntry, Alert, AlertStatus } from './types';

const DB_NAME = 'trading-journal-db';
const DB_VERSION = 2;
const JOURNAL_STORE = 'journal';
const ALERTS_STORE = 'alerts';


interface TradingDB extends DBSchema {
  [JOURNAL_STORE]: {
    key: string;
    value: JournalEntry;
    indexes: { 'date': string, 'symbol': string };
  };
  [ALERTS_STORE]: {
    key: string;
    value: Alert;
    indexes: { 'status': string };
  };
}

const getDb = () => {
  return openDB<TradingDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(JOURNAL_STORE)) {
          const store = db.createObjectStore(JOURNAL_STORE, { keyPath: 'id' });
          store.createIndex('date', 'date');
          store.createIndex('symbol', 'symbol');
        }
      }
      if (oldVersion < 2) {
         if (!db.objectStoreNames.contains(ALERTS_STORE)) {
            const store = db.createObjectStore(ALERTS_STORE, { keyPath: 'id' });
            store.createIndex('status', 'status');
          }
      }
    },
  });
};

const coerceEntry = (entry: any): JournalEntry => {
    const numberFields: (keyof JournalEntry)[] = [
        'entryPrice', 'exitPrice', 'stopLoss', 'takeProfit',
        'positionSize', 'riskRewardRatio', 'profitOrLoss'
    ];
    
    const coercedEntry = { ...entry };

    for (const field of numberFields) {
        if (coercedEntry[field] !== undefined && coercedEntry[field] !== null) {
            const num = parseFloat(coercedEntry[field]);
            coercedEntry[field] = isNaN(num) ? undefined : num;
        } else {
             coercedEntry[field] = undefined;
        }
    }

    return coercedEntry as JournalEntry;
};

// Dispatch a custom event whenever the journal is updated
const dispatchUpdate = () => {
    window.dispatchEvent(new CustomEvent('journalUpdated'));
}

export const addJournalEntry = async (entry: JournalEntry) => {
  const db = await getDb();
  await db.put(JOURNAL_STORE, coerceEntry(entry));
  dispatchUpdate();
};

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  try {
    const db = await getDb();
    const entries = await db.getAll(JOURNAL_STORE);
    return entries.map(coerceEntry);
  } catch (error) {
    console.error("Failed to get journal entries:", error);
    return [];
  }
};

export const getEntriesBySymbol = async (symbol: string): Promise<JournalEntry[]> => {
    if (!symbol) return [];
    try {
        const db = await getDb();
        const entries = await db.getAll(JOURNAL_STORE);
        return entries
            .filter(e => e.symbol && e.symbol.toLowerCase() === symbol.toLowerCase())
            .map(coerceEntry);
    } catch (error) {
        console.error(`Failed to get entries for symbol ${symbol}:`, error);
        return [];
    }
};

export const getAllTags = async (): Promise<string[]> => {
  try {
    const db = await getDb();
    const entries = await db.getAll(JOURNAL_STORE);
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  } catch (error) {
    console.error("Failed to get all tags:", error);
    return [];
  }
};

export const getLatestJournalEntries = async (limit: number): Promise<JournalEntry[]> => {
  try {
    const db = await getDb();
    const allEntries = await db.getAll(JOURNAL_STORE);
    return allEntries
      .map(coerceEntry)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Failed to get latest journal entries:", error);
    return [];
  }
};

export const deleteJournalEntry = async (id: string) => {
  const db = await getDb();
  await db.delete(JOURNAL_STORE, id);
  dispatchUpdate();
};


// --- Alert Functions ---
export const addAlert = async (alert: Alert) => {
  const db = await getDb();
  await db.put(ALERTS_STORE, alert);
};

export const getAlerts = async (status?: AlertStatus): Promise<Alert[]> => {
  const db = await getDb();
  if (status) {
      return db.getAllFromIndex(ALERTS_STORE, 'status', status);
  }
  const allAlerts = await db.getAll(ALERTS_STORE);
  return allAlerts.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const deleteAlert = async (id: string) => {
  const db = await getDb();
  await db.delete(ALERTS_STORE, id);
};

export const updateAlertStatus = async (id: string, status: AlertStatus) => {
  const db = await getDb();
  const alert = await db.get(ALERTS_STORE, id);
  if (alert) {
    alert.status = status;
    await db.put(ALERTS_STORE, alert);
  }
};