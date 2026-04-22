// ---------------------------------------------------------------------------
// DismissalScreen – parent car-pickup arrival intent.
//
// State machine:
//   idle      → parent hasn't signalled yet — show ETA picker + CTA
//   pending   → intent sent, school hasn't called child — show queue position
//   notified  → school marked child ready — show "head to gate" banner
//   completed → pickup done — show confirmation + option to dismiss
// ---------------------------------------------------------------------------

import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import {
  useCompletePickup,
  useDismissalIntent,
  useSignalArrival,
} from "../hooks/useDismissal";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const ETA_OPTIONS = [
  { value: 0,  label: "I'm here",  sub: "At the gate now"   },
  { value: 1,  label: "1 min",     sub: "Turning into lane" },
  { value: 5,  label: "5 min",     sub: "Nearby"            },
  { value: 10, label: "10 min",    sub: "On the way"        },
];

export function DismissalScreen() {
  const { data: dashboard } = useParentDashboard();
  const studentId = dashboard?.student?.id ?? 1;
  const studentName = dashboard?.student?.name?.split(" ")[0] ?? "your child";

  const { data: intent, isLoading } = useDismissalIntent(studentId);
  const signalArrival = useSignalArrival();
  const completePickup = useCompletePickup();

  const [selectedEta, setSelectedEta] = useState<number>(5);

  async function handleSignal() {
    await signalArrival.mutateAsync({ student_id: studentId, eta_minutes: selectedEta });
  }

  async function handleDone() {
    await completePickup.mutateAsync(studentId);
  }

  if (isLoading) {
    return (
      <Screen>
        <SectionTitle title="Car Pickup" subtitle="Dismissal queue" />
        <View style={styles.center}>
          <ActivityIndicator color={palette.brand} size="large" />
        </View>
      </Screen>
    );
  }

  // ── Notified: school has called the child ──────────────────────────────────
  if (intent?.status === "notified") {
    return (
      <Screen>
        <SectionTitle title="Car Pickup" subtitle="Dismissal queue" />

        <LinearGradient
          colors={["#16a34a", "#15803d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroOrb} />
          <Text style={styles.heroEmoji}>🎒</Text>
          <Text style={styles.heroTitle}>{studentName} is at the gate</Text>
          <Text style={styles.heroSub}>
            Head to the pickup gate — {studentName} is ready and waiting for you.
          </Text>
          <View style={styles.heroPill}>
            <View style={styles.heroPillDot} />
            <Text style={styles.heroPillText}>READY FOR PICKUP</Text>
          </View>
        </LinearGradient>

        <InfoCard title="What to do" subtitle="Quick steps">
          {[
            "Pull into the school's designated pickup lane.",
            "Show your parent ID or QR to the gate staff if required.",
            "Tap "Pickup complete" once your child is in the car.",
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </InfoCard>

        <TouchableOpacity
          onPress={handleDone}
          disabled={completePickup.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#16a34a", "#15803d"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneBtn}
          >
            {completePickup.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.doneBtnText}>Pickup complete ✓</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </Screen>
    );
  }

  // ── Pending: intent sent, waiting for school ───────────────────────────────
  if (intent?.status === "pending") {
    return (
      <Screen>
        <SectionTitle title="Car Pickup" subtitle="Dismissal queue" />

        <LinearGradient
          colors={["#4f46e5", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroOrb} />
          <Text style={styles.heroLabel}>QUEUE POSITION</Text>
          <Text style={styles.queueNum}>#{intent.queue_position}</Text>
          <Text style={styles.heroSub}>
            in line for {studentName} · {intent.eta_label} ETA
          </Text>
          <View style={styles.heroPill}>
            <View style={styles.heroPillDot} />
            <Text style={styles.heroPillText}>WAITING FOR SCHOOL</Text>
          </View>
        </LinearGradient>

        <InfoCard title="What happens next" subtitle="While you wait">
          <Text style={styles.waitText}>
            The school office will call {studentName} to the gate when it's your
            turn. You'll get a notification the moment your child is ready.
          </Text>
          <View style={styles.waitRow}>
            <View style={styles.waitIcon}>
              <Text style={styles.waitIconText}>🔔</Text>
            </View>
            <Text style={styles.waitSub}>
              Keep notifications on — you'll be pinged immediately.
            </Text>
          </View>
        </InfoCard>

        <InfoCard title="Your arrival details" subtitle="Sent to the school office">
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{intent.eta_label}</Text>
              <Text style={styles.detailLabel}>ETA</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>#{intent.queue_position}</Text>
              <Text style={styles.detailLabel}>Position</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{studentName}</Text>
              <Text style={styles.detailLabel}>Student</Text>
            </View>
          </View>
        </InfoCard>
      </Screen>
    );
  }

  // ── Completed: pickup done ─────────────────────────────────────────────────
  if (intent?.status === "completed") {
    return (
      <Screen>
        <SectionTitle title="Car Pickup" subtitle="Dismissal queue" />
        <View style={styles.completedCard}>
          <Text style={styles.completedEmoji}>✅</Text>
          <Text style={styles.completedTitle}>Pickup complete</Text>
          <Text style={styles.completedSub}>
            {studentName} has been picked up. See you tomorrow!
          </Text>
        </View>
        <InfoCard title="Signal again?" subtitle="If you need to return">
          <Text style={styles.waitText}>
            Tap below if you need to signal arrival for another student or a
            re-pickup.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => completePickup.reset()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Start a new pickup signal</Text>
          </TouchableOpacity>
        </InfoCard>
      </Screen>
    );
  }

  // ── Idle: no active intent — show ETA picker ───────────────────────────────
  return (
    <Screen>
      <SectionTitle
        title="Car Pickup"
        subtitle="Signal your arrival to skip the gate queue"
      />

      {/* How it works */}
      <InfoCard title="How dismissal works" subtitle="3 simple steps">
        {[
          { emoji: "📍", text: "Tap "I'm on my way" and pick your ETA." },
          { emoji: "📋", text: "School sees you in the live queue and calls your child." },
          { emoji: "🚗", text: "You get a push notification when your child is at the gate." },
        ].map((item, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepEmoji}>{item.emoji}</Text>
            <Text style={styles.stepText}>{item.text}</Text>
          </View>
        ))}
      </InfoCard>

      {/* ETA picker */}
      <View style={styles.etaSection}>
        <Text style={styles.etaLabel}>How far are you?</Text>
        <View style={styles.etaGrid}>
          {ETA_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.etaCard, selectedEta === opt.value && styles.etaCardActive]}
              onPress={() => setSelectedEta(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.etaValue, selectedEta === opt.value && styles.etaValueActive]}>
                {opt.label}
              </Text>
              <Text style={[styles.etaSub, selectedEta === opt.value && styles.etaSubActive]}>
                {opt.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={handleSignal}
        disabled={signalArrival.isPending}
        activeOpacity={0.85}
        style={signalArrival.isPending ? styles.ctaLoading : undefined}
      >
        <LinearGradient
          colors={["#4f46e5", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          {signalArrival.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaText}>
                I'm on my way · {ETA_OPTIONS.find(o => o.value === selectedEta)?.label}
              </Text>
          }
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.hint}>
        The school office will see your ETA and call {studentName} to the gate
        when it's your turn.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xl,
  },

  // ── Hero card (shared between pending / notified) ────────────────────────
  heroCard: {
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: "hidden",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 10,
  },
  heroOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 21,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: spacing.xs,
  },
  heroPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#86efac",
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.8,
  },
  queueNum: {
    fontSize: 72,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -2,
    lineHeight: 80,
  },

  // ── Steps / info rows ────────────────────────────────────────────────────
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: { fontSize: 12, fontWeight: "900", color: palette.brand },
  stepEmoji: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  stepText: { flex: 1, fontSize: 14, color: palette.inkSoft, lineHeight: 21 },

  // ── Wait state ────────────────────────────────────────────────────────────
  waitText: { fontSize: 14, color: palette.inkSoft, lineHeight: 21 },
  waitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: palette.brandSoft,
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  waitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: palette.brandMid,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  waitIconText: { fontSize: 16 },
  waitSub: { flex: 1, fontSize: 13, color: palette.brand, fontWeight: "600", lineHeight: 19 },

  // ── Detail row (pending state) ────────────────────────────────────────────
  detailRow: { flexDirection: "row", alignItems: "center" },
  detailItem: { flex: 1, alignItems: "center", gap: 4, paddingVertical: spacing.sm },
  detailDivider: { width: 1, height: 36, backgroundColor: palette.stroke },
  detailValue: { fontSize: 18, fontWeight: "900", color: palette.brand, letterSpacing: -0.5 },
  detailLabel: {
    fontSize: 10,
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },

  // ── Done button (notified state) ──────────────────────────────────────────
  doneBtn: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 17,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  doneBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // ── Completed state ───────────────────────────────────────────────────────
  completedCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: palette.success,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  completedEmoji: { fontSize: 48 },
  completedTitle: { fontSize: 20, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 },
  completedSub: { fontSize: 14, color: palette.inkSoft, textAlign: "center", lineHeight: 21 },
  retryBtn: {
    backgroundColor: palette.brandSoft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: palette.brand },

  // ── Idle / ETA picker ────────────────────────────────────────────────────
  etaSection: { gap: spacing.sm },
  etaLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink,
    letterSpacing: -0.2,
  },
  etaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  etaCard: {
    width: "47%",
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.stroke,
    padding: spacing.md,
    gap: 3,
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  etaCardActive: {
    borderColor: palette.brand,
    backgroundColor: palette.brandSoft,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.inkSoft,
    letterSpacing: -0.3,
  },
  etaValueActive: { color: palette.brand },
  etaSub: { fontSize: 11, color: palette.inkFaint, fontWeight: "500" },
  etaSubActive: { color: palette.brandDeep },

  // ── Main CTA ─────────────────────────────────────────────────────────────
  cta: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 17,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaLoading: { opacity: 0.7 },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },
  hint: {
    fontSize: 12,
    color: palette.inkFaint,
    textAlign: "center",
    lineHeight: 18,
  },
});
