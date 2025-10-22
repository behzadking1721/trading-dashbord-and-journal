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

export const addJournalEntry = async (entry: JournalEntry) => {
  const db = await initDB();
  await db.put(JOURNAL_STORE, entry);
};

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  const db = await initDB();
  return await db.getAll(JOURNAL_STORE);
};

export const deleteJournalEntry = async (id: string) => {
  const db = await initDB();
  await db.delete(JOURNAL_STORE, id);
};
