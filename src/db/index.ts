import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  defaultRate: number;
  createdAt: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  defaultRate: number;
  createdAt: string;
  isActive: boolean;
}

export interface DeliveryEntry {
  id: string;
  type: 'customer' | 'supplier';
  partyId: string;
  date: string;
  litres: number;
  rate: number;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface PaymentEntry {
  id: string;
  type: 'customer' | 'supplier';
  partyId: string;
  date: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface AppSettings {
  key: string;
  language: 'hi' | 'en';
  defaultCustomerRate: number;
  defaultSupplierRate: number;
}

interface DoodhKhataDB extends DBSchema {
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-name': string };
  };
  suppliers: {
    key: string;
    value: Supplier;
    indexes: { 'by-name': string };
  };
  deliveryEntries: {
    key: string;
    value: DeliveryEntry;
    indexes: { 'by-party': string; 'by-date': string; 'by-party-date': [string, string] };
  };
  paymentEntries: {
    key: string;
    value: PaymentEntry;
    indexes: { 'by-party': string; 'by-date': string; 'by-party-date': [string, string] };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

let dbInstance: IDBPDatabase<DoodhKhataDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<DoodhKhataDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DoodhKhataDB>('doodhkhata', 1, {
    upgrade(db) {
      // Customers store
      const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
      customersStore.createIndex('by-name', 'name');

      // Suppliers store
      const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'id' });
      suppliersStore.createIndex('by-name', 'name');

      // Delivery entries store
      const deliveryStore = db.createObjectStore('deliveryEntries', { keyPath: 'id' });
      deliveryStore.createIndex('by-party', 'partyId');
      deliveryStore.createIndex('by-date', 'date');
      deliveryStore.createIndex('by-party-date', ['partyId', 'date']);

      // Payment entries store
      const paymentStore = db.createObjectStore('paymentEntries', { keyPath: 'id' });
      paymentStore.createIndex('by-party', 'partyId');
      paymentStore.createIndex('by-date', 'date');
      paymentStore.createIndex('by-party-date', ['partyId', 'date']);

      // Settings store
      db.createObjectStore('settings', { keyPath: 'key' });
    },
  });

  return dbInstance;
}
