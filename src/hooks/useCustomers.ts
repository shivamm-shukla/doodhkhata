import { useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../db/index';

export function useCustomers() {
  const { state, loadCustomers, createCustomer, editCustomer, removeCustomer } = useData();

  useEffect(() => {
    if (state.customers.length === 0) {
      loadCustomers();
    }
  }, []);

  const activeCustomers = state.customers.filter(c => c.isActive);

  return {
    customers: state.customers,
    activeCustomers,
    loadCustomers,
    createCustomer,
    editCustomer,
    removeCustomer,
  };
}

export function useCustomerBalance(customerId: string) {
  const { state } = useData();

  const deliveries = state.customerDeliveries[customerId] ?? [];
  const payments = state.customerPayments[customerId] ?? [];

  const totalDelivery = deliveries.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalDelivery - totalPaid;

  return { totalDelivery, totalPaid, balance };
}
