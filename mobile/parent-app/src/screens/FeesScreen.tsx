// ---------------------------------------------------------------------------
// FeesScreen – parent fee management.
// Shows pending + overdue invoices with a Pay Now button, and payment history.
// ---------------------------------------------------------------------------

import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useFees, type FeeInvoice, type PaymentTransaction } from "../hooks/useFees";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

// ── Status colours ────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pending:   "#d97706",
  overdue:   "#dc2626",
  paid:      "#16a34a",
  cancelled: "#94a3b8",
};
const STATUS_BG: Record<string, string> = {
  pending:   "#fef9c3",
  overdue:   "#fee2e2",
  paid:      "#dcfce7",
  cancelled: "#f1f5f9",
};

// ── Invoice card ──────────────────────────────────────────────────────────────

function InvoiceCard({
  invoice,
  onPay,
}: {
  invoice: FeeInvoice;
  onPay: (invoice: FeeInvoice) => void;
}) {
  const isPending = invoice.status === "pending" || invoice.status === "overdue";
  const color     = STATUS_COLOR[invoice.status] ?? palette.ink;
  const bg        = STATUS_BG[invoice.status]    ?? "#f8fafc";

  return (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.invoiceCategory}>{invoice.category_name}</Text>
          <Text style={styles.invoiceStudent}>{invoice.student_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
          <Text style={[styles.statusText, { color }]}>
            {invoice.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.invoiceBottom}>
        <View>
          <Text style={styles.invoiceAmount}>₹{invoice.amount.toLocaleString("en-IN")}</Text>
          <Text style={styles.invoiceDue}>Due: {invoice.due_date}</Text>
        </View>

        {isPending && (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => onPay(invoice)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payBtnGradient}
            >
              <Text style={styles.payBtnText}>Pay Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {invoice.status === "paid" && invoice.paid_at && (
          <Text style={styles.paidAt}>
            Paid {new Date(invoice.paid_at).toLocaleDateString("en-IN")}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────

function TransactionRow({ txn }: { txn: PaymentTransaction }) {
  return (
    <View style={styles.txnRow}>
      <View style={styles.txnIcon}>
        <Text style={{ fontSize: 16 }}>✅</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txnId} numberOfLines={1}>
          {txn.razorpay_payment_id}
        </Text>
        <Text style={styles.txnDate}>
          {new Date(txn.created_at).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </Text>
      </View>
      <Text style={styles.txnAmount}>₹{Number(txn.amount).toLocaleString("en-IN")}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function FeesScreen() {
  const { token, schoolSlug } = useSessionStore((s) => ({
    token:      s.token,
    schoolSlug: s.schoolSlug,
  }));

  const { invoices, transactions, loading, error, createOrder, verifyPayment } =
    useFees(schoolSlug, token);

  const pending    = invoices.filter((i) => i.status === "pending" || i.status === "overdue");
  const paid       = invoices.filter((i) => i.status === "paid");
  const totalOwed  = pending.reduce((sum, i) => sum + Number(i.amount), 0);
  const hasOverdue = invoices.some((i) => i.status === "overdue");

  const handlePay = async (invoice: FeeInvoice) => {
    try {
      const order = await createOrder(invoice.id);

      // In production: open Razorpay SDK checkout here.
      // For now we open the Razorpay payment link via deep-link / WebView.
      Alert.alert(
        "Razorpay Checkout",
        `Order created: ${order.order_id}\nAmount: ₹${(order.amount / 100).toLocaleString("en-IN")}\n\n` +
        "In production this opens the Razorpay payment sheet. " +
        "After payment, the app calls /api/payments/parent/verify/ to confirm.",
        [
          { text: "Cancel",   style: "cancel" },
          {
            text: "Simulate Pay",
            onPress: async () => {
              // Simulate a successful payment (dev only)
              try {
                await verifyPayment({
                  invoice_id:            invoice.id,
                  razorpay_payment_id:   `pay_demo_${Date.now()}`,
                  razorpay_order_id:     order.order_id,
                  razorpay_signature:    "demo_signature",
                });
                Alert.alert("Payment Successful", "Your fee has been paid.");
              } catch {
                Alert.alert("Error", "Payment verification failed.");
              }
            },
          },
        ],
      );
    } catch {
      Alert.alert("Error", "Could not create payment order. Please try again.");
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={palette.brand} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle title="Fees & Payments" subtitle="Manage your school fee payments" />

      {/* ── Summary hero ──────────────────────────────────────────────────── */}
      <LinearGradient
        colors={hasOverdue ? ["#dc2626", "#b91c1c"] : ["#4f46e5", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroOrb1} />
        <View style={styles.heroOrb2} />

        <Text style={styles.heroLabel}>
          {hasOverdue ? "⚠️  OVERDUE FEES" : "TOTAL DUE"}
        </Text>
        <Text style={styles.heroAmount}>
          ₹{totalOwed.toLocaleString("en-IN")}
        </Text>
        <Text style={styles.heroSub}>
          {pending.length} pending invoice{pending.length !== 1 ? "s" : ""}
        </Text>
      </LinearGradient>

      {/* ── Pending invoices ──────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <>
          <SectionTitle title="Pending Fees" subtitle="" />
          {pending.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} onPay={handlePay} />
          ))}
        </>
      )}

      {/* ── Paid invoices ─────────────────────────────────────────────────── */}
      {paid.length > 0 && (
        <InfoCard title="Paid Fees" subtitle={`${paid.length} paid`}>
          {paid.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} onPay={handlePay} />
          ))}
        </InfoCard>
      )}

      {/* ── Transaction history ───────────────────────────────────────────── */}
      {transactions.length > 0 && (
        <InfoCard title="Payment History" subtitle="Razorpay transactions">
          {transactions.map((txn) => (
            <TransactionRow key={txn.id} txn={txn} />
          ))}
        </InfoCard>
      )}

      {invoices.length === 0 && !loading && (
        <InfoCard title="All clear!" subtitle="">
          <Text style={styles.emptyText}>No outstanding fees at this time.</Text>
        </InfoCard>
      )}

      {error && (
        <InfoCard title="Error" subtitle="">
          <Text style={[styles.emptyText, { color: palette.danger }]}>{error}</Text>
        </InfoCard>
      )}
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    padding: spacing.lg,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: spacing.sm,
  },
  heroOrb1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroOrb2: {
    position: "absolute",
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
    marginTop: 4,
  },

  invoiceCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  invoiceTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  invoiceCategory: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.ink,
  },
  invoiceStudent: {
    fontSize: 13,
    color: palette.inkSoft,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  invoiceBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.5,
  },
  invoiceDue: {
    fontSize: 12,
    color: palette.inkSoft,
    marginTop: 2,
  },
  payBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  payBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  payBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  paidAt: {
    fontSize: 12,
    color: STATUS_COLOR.paid,
    fontWeight: "700",
  },

  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.stroke,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  txnId: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.ink,
    fontVariant: ["tabular-nums"],
  },
  txnDate: {
    fontSize: 11,
    color: palette.inkSoft,
    marginTop: 1,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: palette.ink,
  },

  emptyText: {
    fontSize: 14,
    color: palette.inkSoft,
    lineHeight: 21,
  },
});
