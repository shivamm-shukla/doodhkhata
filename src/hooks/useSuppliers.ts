import { useEffect } from 'react';
import { useData } from '../context/DataContext';

export function useSuppliers() {
  const { state, loadSuppliers, createSupplier, editSupplier, removeSupplier } = useData();

  useEffect(() => {
    if (state.suppliers.length === 0) {
      loadSuppliers();
    }
  }, []);

  const activeSuppliers = state.suppliers.filter(s => s.isActive);

  return {
    suppliers: state.suppliers,
    activeSuppliers,
    loadSuppliers,
    createSupplier,
    editSupplier,
    removeSupplier,
  };
}

export function useSupplierBalance(supplierId: string) {
  const { state } = useData();

  const deliveries = state.supplierDeliveries[supplierId] ?? [];
  const payments = state.supplierPayments[supplierId] ?? [];

  const totalPurchased = deliveries.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalPurchased - totalPaid;

  return { totalPurchased, totalPaid, balance };
}
