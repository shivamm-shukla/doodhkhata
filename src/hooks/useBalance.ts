import { useState, useEffect } from 'react';
import { getAllCustomers, getAllSuppliers, calculateCustomerBalance, calculateSupplierBalance } from '../db/queries';

export function useTotalBalances() {
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [customers, suppliers] = await Promise.all([getAllCustomers(), getAllSuppliers()]);
      const activeCustomers = customers.filter(c => c.isActive);
      const activeSuppliers = suppliers.filter(s => s.isActive);

      let receivable = 0;
      let payable = 0;

      for (const c of activeCustomers) {
        const bal = await calculateCustomerBalance(c.id);
        if (bal > 0) receivable += bal;
        // negative means advance, not receivable
      }

      for (const s of activeSuppliers) {
        const bal = await calculateSupplierBalance(s.id);
        if (bal > 0) payable += bal;
      }

      setTotalReceivable(receivable);
      setTotalPayable(payable);
    } catch (err) {
      console.error('Failed to load balances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { totalReceivable, totalPayable, loading, refresh: load };
}
