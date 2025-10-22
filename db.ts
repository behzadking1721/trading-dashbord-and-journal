import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { JournalEntry } from './types';

const DB_NAME = 'trading-journal-db';
const DB_VERSION = 1;
const JOURNAL_STORE = 'journal';

interface TradingDB extends DBSchema {
  [JOURNAL_STORE]: {
    key: string;
    value: JournalEntry;
    indexes: { 'date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<TradingDB>> | null = null;

const initDB = () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB<TradingDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(JOURNAL_STORE)) {
        const store = db.createObjectStore(JOURNAL_STORE, { keyPath: 'id' });
        store.createIndex('date', 'date');
      }
    },
  });
  return dbPromise;
};

// Dispatch a custom event whenever the journal is updated
const dispatchUpdate = () => {
    window.dispatchEvent(new CustomEvent('journalUpdated'));
}

export const addJournalEntry = async (entry: JournalEntry) => {
  const db = await initDB();
  await db.put(JOURNAL_STORE, entry);
  dispatchUpdate();
};

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  const db = await initDB();
  return await db.getAll(JOURNAL_STORE);
};

export const getLatestJournalEntries = async (limit: number): Promise<JournalEntry[]> => {
  const db = await initDB();
  const allEntries = await db.getAll(JOURNAL_STORE);
  return allEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

export const deleteJournalEntry = async (id: string) => {
  const db = await initDB();
  await db.delete(JOURNAL_STORE, id);
  dispatchUpdate();
};