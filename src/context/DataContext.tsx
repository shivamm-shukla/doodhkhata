import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Customer, Supplier, DeliveryEntry, PaymentEntry } from '../db/index';
import {
  getAllCustomers,
  getAllSuppliers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  addDeliveryEntry,
  deleteDeliveryEntry,
  addPaymentEntry,
  deletePaymentEntry,
  getDeliveriesForParty,
  getPaymentsForParty,
} from '../db/queries';

interface DataState {
  customers: Customer[];
  suppliers: Supplier[];
  customerDeliveries: Record<string, DeliveryEntry[]>;
  customerPayments: Record<string, PaymentEntry[]>;
  supplierDeliveries: Record<string, DeliveryEntry[]>;
  supplierPayments: Record<string, PaymentEntry[]>;
}

type DataAction =
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'SET_CUSTOMER_DELIVERIES'; payload: { id: string; entries: DeliveryEntry[] } }
  | { type: 'SET_CUSTOMER_PAYMENTS'; payload: { id: string; entries: PaymentEntry[] } }
  | { type: 'SET_SUPPLIER_DELIVERIES'; payload: { id: string; entries: DeliveryEntry[] } }
  | { type: 'SET_SUPPLIER_PAYMENTS'; payload: { id: string; entries: PaymentEntry[] } };

const initialState: DataState = {
  customers: [],
  suppliers: [],
  customerDeliveries: {},
  customerPayments: {},
  supplierDeliveries: {},
  supplierPayments: {},
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'SET_CUSTOMER_DELIVERIES':
      return {
        ...state,
        customerDeliveries: { ...state.customerDeliveries, [action.payload.id]: action.payload.entries },
      };
    case 'SET_CUSTOMER_PAYMENTS':
      return {
        ...state,
        customerPayments: { ...state.customerPayments, [action.payload.id]: action.payload.entries },
      };
    case 'SET_SUPPLIER_DELIVERIES':
      return {
        ...state,
        supplierDeliveries: { ...state.supplierDeliveries, [action.payload.id]: action.payload.entries },
      };
    case 'SET_SUPPLIER_PAYMENTS':
      return {
        ...state,
        supplierPayments: { ...state.supplierPayments, [action.payload.id]: action.payload.entries },
      };
    default:
      return state;
  }
}

interface DataContextValue {
  state: DataState;
  loadCustomers: () => Promise<void>;
  loadSuppliers: () => Promise<void>;
  loadCustomerEntries: (id: string) => Promise<void>;
  loadSupplierEntries: (id: string) => Promise<void>;
  createCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  editCustomer: (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
  createSupplier: (data: Omit<Supplier, 'id' | 'createdAt'>) => Promise<Supplier>;
  editSupplier: (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => Promise<void>;
  removeSupplier: (id: string) => Promise<void>;
  createDeliveryEntry: (data: Omit<DeliveryEntry, 'id' | 'createdAt' | 'amount'>) => Promise<DeliveryEntry>;
  removeDeliveryEntry: (id: string, partyId: string, partyType: 'customer' | 'supplier') => Promise<void>;
  createPaymentEntry: (data: Omit<PaymentEntry, 'id' | 'createdAt'>) => Promise<PaymentEntry>;
  removePaymentEntry: (id: string, partyId: string, partyType: 'customer' | 'supplier') => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const loadCustomers = useCallback(async () => {
    const customers = await getAllCustomers();
    dispatch({ type: 'SET_CUSTOMERS', payload: customers });
  }, []);

  const loadSuppliers = useCallback(async () => {
    const suppliers = await getAllSuppliers();
    dispatch({ type: 'SET_SUPPLIERS', payload: suppliers });
  }, []);

  const loadCustomerEntries = useCallback(async (id: string) => {
    const [deliveries, payments] = await Promise.all([
      getDeliveriesForParty(id),
      getPaymentsForParty(id),
    ]);
    dispatch({ type: 'SET_CUSTOMER_DELIVERIES', payload: { id, entries: deliveries.filter(d => d.type === 'customer') } });
    dispatch({ type: 'SET_CUSTOMER_PAYMENTS', payload: { id, entries: payments.filter(p => p.type === 'customer') } });
  }, []);

  const loadSupplierEntries = useCallback(async (id: string) => {
    const [deliveries, payments] = await Promise.all([
      getDeliveriesForParty(id),
      getPaymentsForParty(id),
    ]);
    dispatch({ type: 'SET_SUPPLIER_DELIVERIES', payload: { id, entries: deliveries.filter(d => d.type === 'supplier') } });
    dispatch({ type: 'SET_SUPPLIER_PAYMENTS', payload: { id, entries: payments.filter(p => p.type === 'supplier') } });
  }, []);

  const createCustomer = useCallback(async (data: Omit<Customer, 'id' | 'createdAt'>) => {
    const customer = await addCustomer(data);
    dispatch({ type: 'SET_CUSTOMERS', payload: [...state.customers, customer].sort((a, b) => a.name.localeCompare(b.name)) });
    return customer;
  }, [state.customers]);

  const editCustomer = useCallback(async (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
    await updateCustomer(id, data);
    const updated = state.customers.map(c => c.id === id ? { ...c, ...data } : c);
    dispatch({ type: 'SET_CUSTOMERS', payload: updated });
  }, [state.customers]);

  const removeCustomer = useCallback(async (id: string) => {
    await deleteCustomer(id);
    const updated = state.customers.map(c => c.id === id ? { ...c, isActive: false } : c);
    dispatch({ type: 'SET_CUSTOMERS', payload: updated });
  }, [state.customers]);

  const createSupplier = useCallback(async (data: Omit<Supplier, 'id' | 'createdAt'>) => {
    const supplier = await addSupplier(data);
    dispatch({ type: 'SET_SUPPLIERS', payload: [...state.suppliers, supplier].sort((a, b) => a.name.localeCompare(b.name)) });
    return supplier;
  }, [state.suppliers]);

  const editSupplier = useCallback(async (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => {
    await updateSupplier(id, data);
    const updated = state.suppliers.map(s => s.id === id ? { ...s, ...data } : s);
    dispatch({ type: 'SET_SUPPLIERS', payload: updated });
  }, [state.suppliers]);

  const removeSupplier = useCallback(async (id: string) => {
    await deleteSupplier(id);
    const updated = state.suppliers.map(s => s.id === id ? { ...s, isActive: false } : s);
    dispatch({ type: 'SET_SUPPLIERS', payload: updated });
  }, [state.suppliers]);

  const createDeliveryEntry = useCallback(async (data: Omit<DeliveryEntry, 'id' | 'createdAt' | 'amount'>) => {
    const entry = await addDeliveryEntry(data);
    if (data.type === 'customer') {
      const existing = state.customerDeliveries[data.partyId] ?? [];
      dispatch({ type: 'SET_CUSTOMER_DELIVERIES', payload: { id: data.partyId, entries: [entry, ...existing] } });
    } else {
      const existing = state.supplierDeliveries[data.partyId] ?? [];
      dispatch({ type: 'SET_SUPPLIER_DELIVERIES', payload: { id: data.partyId, entries: [entry, ...existing] } });
    }
    return entry;
  }, [state.customerDeliveries, state.supplierDeliveries]);

  const removeDeliveryEntry = useCallback(async (id: string, partyId: string, partyType: 'customer' | 'supplier') => {
    await deleteDeliveryEntry(id);
    if (partyType === 'customer') {
      const existing = (state.customerDeliveries[partyId] ?? []).filter(e => e.id !== id);
      dispatch({ type: 'SET_CUSTOMER_DELIVERIES', payload: { id: partyId, entries: existing } });
    } else {
      const existing = (state.supplierDeliveries[partyId] ?? []).filter(e => e.id !== id);
      dispatch({ type: 'SET_SUPPLIER_DELIVERIES', payload: { id: partyId, entries: existing } });
    }
  }, [state.customerDeliveries, state.supplierDeliveries]);

  const createPaymentEntry = useCallback(async (data: Omit<PaymentEntry, 'id' | 'createdAt'>) => {
    const entry = await addPaymentEntry(data);
    if (data.type === 'customer') {
      const existing = state.customerPayments[data.partyId] ?? [];
      dispatch({ type: 'SET_CUSTOMER_PAYMENTS', payload: { id: data.partyId, entries: [entry, ...existing] } });
    } else {
      const existing = state.supplierPayments[data.partyId] ?? [];
      dispatch({ type: 'SET_SUPPLIER_PAYMENTS', payload: { id: data.partyId, entries: [entry, ...existing] } });
    }
    return entry;
  }, [state.customerPayments, state.supplierPayments]);

  const removePaymentEntry = useCallback(async (id: string, partyId: string, partyType: 'customer' | 'supplier') => {
    await deletePaymentEntry(id);
    if (partyType === 'customer') {
      const existing = (state.customerPayments[partyId] ?? []).filter(e => e.id !== id);
      dispatch({ type: 'SET_CUSTOMER_PAYMENTS', payload: { id: partyId, entries: existing } });
    } else {
      const existing = (state.supplierPayments[partyId] ?? []).filter(e => e.id !== id);
      dispatch({ type: 'SET_SUPPLIER_PAYMENTS', payload: { id: partyId, entries: existing } });
    }
  }, [state.customerPayments, state.supplierPayments]);

  return (
    <DataContext.Provider value={{
      state,
      loadCustomers,
      loadSuppliers,
      loadCustomerEntries,
      loadSupplierEntries,
      createCustomer,
      editCustomer,
      removeCustomer,
      createSupplier,
      editSupplier,
      removeSupplier,
      createDeliveryEntry,
      removeDeliveryEntry,
      createPaymentEntry,
      removePaymentEntry,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
