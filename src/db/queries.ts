import { getDB, Customer, Supplier, DeliveryEntry, PaymentEntry, AppSettings } from './index';
import { generateId } from '../utils/uuid';
import { todayString } from '../utils/format';

// ─── Settings ────────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings | null> {
  const db = await getDB();
  const settings = await db.get('settings', 'main');
  return settings ?? null;
}

export async function saveSettings(settings: Omit<AppSettings, 'key'>): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: 'main', ...settings });
}

// ─── Customers ────────────────────────────────────────────────
export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDB();
  const all = await db.getAll('customers');
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const db = await getDB();
  return db.get('customers', id);
}

export async function addCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
  const db = await getDB();
  const customer: Customer = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  await db.add('customers', customer);
  return customer;
}

export async function updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('customers', id);
  if (!existing) throw new Error('Customer not found');
  await db.put('customers', { ...existing, ...data });
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDB();
  await db.put('customers', { ...(await db.get('customers', id))!, isActive: false });
}

// ─── Suppliers ────────────────────────────────────────────────
export async function getAllSuppliers(): Promise<Supplier[]> {
  const db = await getDB();
  const all = await db.getAll('suppliers');
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSupplier(id: string): Promise<Supplier | undefined> {
  const db = await getDB();
  return db.get('suppliers', id);
}

export async function addSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
  const db = await getDB();
  const supplier: Supplier = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  await db.add('suppliers', supplier);
  return supplier;
}

export async function updateSupplier(id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('suppliers', id);
  if (!existing) throw new Error('Supplier not found');
  await db.put('suppliers', { ...existing, ...data });
}

export async function deleteSupplier(id: string): Promise<void> {
  const db = await getDB();
  await db.put('suppliers', { ...(await db.get('suppliers', id))!, isActive: false });
}

// ─── Delivery Entries ─────────────────────────────────────────
export async function addDeliveryEntry(data: Omit<DeliveryEntry, 'id' | 'createdAt' | 'amount'>): Promise<DeliveryEntry> {
  const db = await getDB();
  const entry: DeliveryEntry = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    amount: data.litres * data.rate,
    ...data,
  };
  await db.add('deliveryEntries', entry);
  return entry;
}

export async function getDeliveriesForParty(partyId: string): Promise<DeliveryEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('deliveryEntries', 'by-party', partyId);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllDeliveries(): Promise<DeliveryEntry[]> {
  const db = await getDB();
  return db.getAll('deliveryEntries');
}

export async function getDeliveriesForDate(date: string): Promise<DeliveryEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('deliveryEntries', 'by-date', date);
}

export async function deleteDeliveryEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('deliveryEntries', id);
}

// ─── Payment Entries ──────────────────────────────────────────
export async function addPaymentEntry(data: Omit<PaymentEntry, 'id' | 'createdAt'>): Promise<PaymentEntry> {
  const db = await getDB();
  const entry: PaymentEntry = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  await db.add('paymentEntries', entry);
  return entry;
}

export async function getPaymentsForParty(partyId: string): Promise<PaymentEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('paymentEntries', 'by-party', partyId);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllPayments(): Promise<PaymentEntry[]> {
  const db = await getDB();
  return db.getAll('paymentEntries');
}

export async function deletePaymentEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('paymentEntries', id);
}

// ─── Balance Calculations ─────────────────────────────────────
export async function calculateCustomerBalance(customerId: string): Promise<number> {
  const deliveries = await getDeliveriesForParty(customerId);
  const payments = await getPaymentsForParty(customerId);
  const totalDelivery = deliveries
    .filter(d => d.type === 'customer')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = payments
    .filter(p => p.type === 'customer')
    .reduce((sum, p) => sum + p.amount, 0);
  return totalDelivery - totalPaid;
}

export async function calculateSupplierBalance(supplierId: string): Promise<number> {
  const deliveries = await getDeliveriesForParty(supplierId);
  const payments = await getPaymentsForParty(supplierId);
  const totalPurchased = deliveries
    .filter(d => d.type === 'supplier')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = payments
    .filter(p => p.type === 'supplier')
    .reduce((sum, p) => sum + p.amount, 0);
  return totalPurchased - totalPaid;
}

// ─── Today's Summary ──────────────────────────────────────────
export async function getTodaySummary() {
  const today = todayString();
  const todayDeliveries = await getDeliveriesForDate(today);
  const allCustomers = await getAllCustomers();
  const allSuppliers = await getAllSuppliers();

  const customerIds = new Set(allCustomers.map(c => c.id));
  const supplierIds = new Set(allSuppliers.map(s => s.id));

  let soldLitres = 0;
  let purchasedLitres = 0;

  for (const d of todayDeliveries) {
    if (d.type === 'customer' && customerIds.has(d.partyId)) {
      soldLitres += d.litres;
    } else if (d.type === 'supplier' && supplierIds.has(d.partyId)) {
      purchasedLitres += d.litres;
    }
  }

  return { soldLitres, purchasedLitres };
}

// ─── Recent Activities ────────────────────────────────────────
export interface ActivityItem {
  id: string;
  entryType: 'delivery' | 'payment';
  partyType: 'customer' | 'supplier';
  partyId: string;
  partyName: string;
  date: string;
  amount: number;
  litres?: number;
  createdAt: string;
}

export async function getRecentActivities(limit = 10): Promise<ActivityItem[]> {
  const db = await getDB();
  const allDeliveries = await db.getAll('deliveryEntries');
  const allPayments = await db.getAll('paymentEntries');
  const allCustomers = await getAllCustomers();
  const allSuppliers = await getAllSuppliers();

  const partyMap = new Map<string, string>();
  allCustomers.forEach(c => partyMap.set(c.id, c.name));
  allSuppliers.forEach(s => partyMap.set(s.id, s.name));

  const activities: ActivityItem[] = [
    ...allDeliveries.map(d => ({
      id: d.id,
      entryType: 'delivery' as const,
      partyType: d.type,
      partyId: d.partyId,
      partyName: partyMap.get(d.partyId) ?? 'Unknown',
      date: d.date,
      amount: d.amount,
      litres: d.litres,
      createdAt: d.createdAt,
    })),
    ...allPayments.map(p => ({
      id: p.id,
      entryType: 'payment' as const,
      partyType: p.type,
      partyId: p.partyId,
      partyName: partyMap.get(p.partyId) ?? 'Unknown',
      date: p.date,
      amount: p.amount,
      createdAt: p.createdAt,
    })),
  ];

  return activities
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

// ─── Export / Import ──────────────────────────────────────────
export async function exportData() {
  const db = await getDB();
  return {
    customers: await db.getAll('customers'),
    suppliers: await db.getAll('suppliers'),
    deliveryEntries: await db.getAll('deliveryEntries'),
    paymentEntries: await db.getAll('paymentEntries'),
    settings: await db.getAll('settings'),
    exportedAt: new Date().toISOString(),
  };
}

export async function importData(data: {
  customers?: Customer[];
  suppliers?: Supplier[];
  deliveryEntries?: DeliveryEntry[];
  paymentEntries?: PaymentEntry[];
}) {
  const db = await getDB();
  const tx = db.transaction(['customers', 'suppliers', 'deliveryEntries', 'paymentEntries'], 'readwrite');

  if (data.customers) {
    for (const c of data.customers) await tx.objectStore('customers').put(c);
  }
  if (data.suppliers) {
    for (const s of data.suppliers) await tx.objectStore('suppliers').put(s);
  }
  if (data.deliveryEntries) {
    for (const d of data.deliveryEntries) await tx.objectStore('deliveryEntries').put(d);
  }
  if (data.paymentEntries) {
    for (const p of data.paymentEntries) await tx.objectStore('paymentEntries').put(p);
  }

  await tx.done;
}
