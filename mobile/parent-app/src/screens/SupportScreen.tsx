// ---------------------------------------------------------------------------
// SupportScreen – parent support hub.
// Sections: FAQ accordion (by category) + Call Request card.
// Calls are queued and only dispatched after dashboard approval.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

// ── Static FAQ data (backed by /api/calls/faq/ when connected) ───────────────

const FAQS: { category: string; q: string; a: string }[] = [
  {
    category: "Transport",
    q: "How do I track my child's bus in real time?",
    a: "Open the Track tab. You will see a live map with the bus position updated every 30 seconds. The ETA to your child's stop is shown at the top.",
  },
  {
    category: "Transport",
    q: "What should I do if the bus is late?",
    a: "Pull down to refresh the Track screen. If the delay is more than 10 minutes the driver will send an automatic alert. You can also contact the school via the Messages tab.",
  },
  {
    category: "Dismissal",
    q: "How does car pickup work?",
    a: "Tap the Pickup tab and press 'I'm on my way'. The school gate staff will be notified and your child will be called when your car arrives. Tap 'Pickup Complete' once your child is in the car.",
  },
  {
    category: "Dismissal",
    q: "Can I send someone else to pick up my child?",
    a: "Yes. Contact the school office in advance and add the person as an authorised guardian in your Profile settings.",
  },
  {
    category: "Academic",
    q: "How do I see my child's attendance?",
    a: "Tap Progress → Attendance. Daily attendance records are synced by the teacher each morning.",
  },
  {
    category: "Academic",
    q: "Can I message the teacher directly?",
    a: "Use the Messages tab to send notes. Teachers respond during working hours.",
  },
  {
    category: "Account",
    q: "How do I update my phone number?",
    a: "Go to Profile → Edit details. Changes require school admin approval before taking effect.",
  },
  {
    category: "Account",
    q: "I forgot my login OTP — what do I do?",
    a: "OTPs expire after 10 minutes. Tap 'Resend OTP' on the login screen to request a fresh code.",
  },
];

const CATEGORIES = Array.from(new Set(FAQS.map((f) => f.category)));

const REASON_OPTIONS = [
  { value: "academic",   label: "Academic concern" },
  { value: "behavioral", label: "Behavioural concern" },
  { value: "transport",  label: "Transport issue" },
  { value: "fees",       label: "Fees enquiry" },
  { value: "general",    label: "General enquiry" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      activeOpacity={0.75}
      onPress={() => setOpen((v) => !v)}
    >
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Text style={styles.faqChevron}>{open ? "▲" : "▼"}</Text>
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

function FAQCategory({ category }: { category: string }) {
  const items = FAQS.filter((f) => f.category === category);
  return (
    <View style={styles.faqCategory}>
      <Text style={styles.categoryLabel}>{category}</Text>
      {items.map((item, i) => (
        <FAQItem key={i} q={item.q} a={item.a} />
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function SupportScreen() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reasonText,     setReasonText]     = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);

  const canSubmit = !!selectedReason && !submitting && !submitted;

  async function handleSubmitRequest() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // TODO: replace with real API call when backend integration is wired.
      await new Promise((r) => setTimeout(r, 900));
      setSubmitted(true);
      Alert.alert(
        "Request received",
        "The school will review your request. You will receive a call once it's approved — usually within 1 business day.",
        [{ text: "OK" }],
      );
    } catch {
      Alert.alert("Error", "Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSelectedReason(null);
    setReasonText("");
    setSubmitted(false);
  }

  return (
    <Screen>
      <SectionTitle title="Support" subtitle="How can we help you?" />

      {/* ── Call Request card ────────────────────────────────────────── */}
      <InfoCard
        title="Request a call"
        subtitle="The school will call you back after reviewing your request."
      >
        {submitted ? (
          <View style={styles.submittedBanner}>
            <Text style={styles.submittedIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.submittedTitle}>Request submitted</Text>
              <Text style={styles.submittedSub}>
                Awaiting school approval. You'll receive a call soon.
              </Text>
            </View>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.newRequestLink}>New request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Reason selector */}
            <Text style={styles.fieldLabel}>What is your enquiry about?</Text>
            <View style={styles.reasonGrid}>
              {REASON_OPTIONS.map((opt) => {
                const active = selectedReason === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.reasonChip, active && styles.reasonChipActive]}
                    onPress={() => setSelectedReason(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.reasonChipText, active && styles.reasonChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional note */}
            <Text style={styles.fieldLabel}>Additional details (optional)</Text>
            <TextInput
              style={styles.textarea}
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Describe your concern so the school can prepare…"
              placeholderTextColor={palette.inkFaint}
              multiline
              numberOfLines={3}
              maxLength={400}
            />

            {/* Availability notice */}
            <View style={styles.noticePill}>
              <Text style={styles.noticeText}>
                📞  Calls are available Mon–Sat, 9 AM – 5 PM after school approval.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmitRequest}
              activeOpacity={0.8}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Request callback</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </InfoCard>

      {/* ── FAQ section ──────────────────────────────────────────────── */}
      <InfoCard title="Frequently asked questions">
        {CATEGORIES.map((cat) => (
          <FAQCategory key={cat} category={cat} />
        ))}
      </InfoCard>

      {/* ── Contact footer ────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          For urgent issues outside school hours, contact your school directly.
        </Text>
      </View>
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // FAQ
  faqCategory: { gap: 2 },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: palette.brand,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 4,
  },
  faqItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.stroke,
    gap: 6,
  },
  faqRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  faqQ: { flex: 1, fontSize: 13, fontWeight: "600", color: palette.ink, lineHeight: 19 },
  faqChevron: { fontSize: 10, color: palette.inkFaint, marginTop: 3 },
  faqA: { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },

  // Reason chips
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.inkSoft,
    marginBottom: 4,
  },
  reasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.surfaceMuted,
  },
  reasonChipActive: {
    borderColor: palette.brand,
    backgroundColor: palette.brandSoft,
  },
  reasonChipText: { fontSize: 12, color: palette.inkSoft, fontWeight: "500" },
  reasonChipTextActive: { color: palette.brand, fontWeight: "700" },

  // Text area
  textarea: {
    borderWidth: 1,
    borderColor: palette.stroke,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: palette.ink,
    minHeight: 76,
    textAlignVertical: "top",
    backgroundColor: palette.surfaceMuted,
  },

  // Notice pill
  noticePill: {
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    padding: 10,
  },
  noticeText: { fontSize: 12, color: palette.brand, lineHeight: 17 },

  // Submit button
  submitBtn: {
    backgroundColor: palette.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Submitted state
  submittedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: spacing.sm,
  },
  submittedIcon:  { fontSize: 24 },
  submittedTitle: { fontSize: 14, fontWeight: "700", color: palette.success },
  submittedSub:   { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  newRequestLink: { fontSize: 12, color: palette.brand, fontWeight: "600" },

  // Footer
  footer: { alignItems: "center", paddingVertical: spacing.md },
  footerText: { fontSize: 12, color: palette.inkFaint, textAlign: "center", lineHeight: 18 },
});
