import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export interface FeeInvoice {
  id: number;
  student: number;
  student_name: string;
  category_name: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  razorpay_order_id: string;
  paid_at: string | null;
}

export interface PaymentOrder {
  order_id: string;
  amount: number;       // paise
  currency: string;
  key_id: string;
  invoice_id: number;
  school_name: string;
  description: string;
}

export interface PaymentTransaction {
  id: number;
  invoice: number;
  razorpay_payment_id: string;
  amount: number;
  platform_fee: number;
  school_amount: number;
  transfer_id: string;
  status: "captured" | "refunded";
  created_at: string;
}

export function useFees(schoolSlug: string, token: string | null) {
  const [invoices,     setInvoices]     = useState<FeeInvoice[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const headers = {
    Authorization:  `Bearer ${token}`,
    "X-School-Slug": schoolSlug,
  };

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [invRes, txRes] = await Promise.all([
        api.get<FeeInvoice[]>("/api/payments/parent/invoices/", { headers }),
        api.get<PaymentTransaction[]>("/api/payments/parent/transactions/", { headers }),
      ]);
      setInvoices(invRes.data);
      setTransactions(txRes.data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load fees.");
    } finally {
      setLoading(false);
    }
  }, [token, schoolSlug]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createOrder = async (invoiceId: number): Promise<PaymentOrder> => {
    const res = await api.post<PaymentOrder>(
      "/api/payments/parent/orders/",
      { invoice_id: invoiceId },
      { headers },
    );
    return res.data;
  };

  const verifyPayment = async (params: {
    invoice_id: number;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Promise<void> => {
    await api.post("/api/payments/parent/verify/", params, { headers });
    await fetchAll();
  };

  return { invoices, transactions, loading, error, refetch: fetchAll, createOrder, verifyPayment };
}
