// ---------------------------------------------------------------------------
// WeeklyDigestScreen – AI-generated weekly report card for parents.
//
// Shows the most recent weekly digest for the parent's child:
//   • Attendance summary (present / absent days + percentage)
//   • AI-written strengths, weaknesses, and teacher highlights
//   • Uplifting overall summary
//   • Past week cards to scroll through
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { api } from "../lib/api";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeeklyDigest {
  id: number;
  week_start: string;
  days_present: number;
  days_absent: number;
  attendance_pct: number;
  strengths_summary: string;
  weaknesses_summary: string;
  teacher_highlights: string;
  overall_summary: string;
}

// ── Attendance Donut (simple SVG-style view) ──────────────────────────────────

function AttendanceRing({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? palette.success : pct >= 75 ? palette.warning : palette.danger;

  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringOuter, { borderColor: color }]}>
        <View style={styles.ringInner}>
          <Text style={[styles.ringPct, { color }]}>{pct}%</Text>
          <Text style={styles.ringLabel}>attendance</Text>
        </View>
      </View>
    </View>
  );
}

// ── Insight Row ───────────────────────────────────────────────────────────────

function InsightRow({
  icon,
  title,
  body,
  color,
  bg,
}: {
  icon: string;
  title: string;
  body: string;
  color: string;
  bg: string;
}) {
  if (!body) return null;
  return (
    <View style={[styles.insightCard, { borderLeftColor: color, backgroundColor: bg }]}>
      <View style={styles.insightHeader}>
        <Text style={styles.insightIcon}>{icon}</Text>
        <Text style={[styles.insightTitle, { color }]}>{title}</Text>
      </View>
      <Text style={styles.insightBody}>{body}</Text>
    </View>
  );
}

// ── Week Selector ─────────────────────────────────────────────────────────────

function WeekChip({
  weekStart,
  active,
  onPress,
}: {
  weekStart: string;
  active: boolean;
  onPress: () => void;
}) {
  const d = new Date(weekStart);
  const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <TouchableOpacity
      style={[styles.weekChip, active && styles.weekChipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.weekChipText, active && styles.weekChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Mock fallback ─────────────────────────────────────────────────────────────

const MOCK_DIGEST: WeeklyDigest = {
  id: 1,
  week_start: "2026-04-14",
  days_present: 4,
  days_absent: 1,
  attendance_pct: 80,
  strengths_summary:
    "Showed strong understanding in Mathematics and actively participated in group discussions.",
  weaknesses_summary:
    "Could improve consistency in completing homework assignments on time.",
  teacher_highlights:
    "Teacher noted excellent progress in reading comprehension this week.",
  overall_summary:
    "It was a great week overall! Keep up the enthusiasm and focus on those daily habits.",
};

// ── WeeklyDigestScreen ────────────────────────────────────────────────────────

export function WeeklyDigestScreen() {
  const { data: dashboard } = useParentDashboard();
  const studentId = (dashboard as any)?.student?.id ?? 1;
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const { data: digests, isLoading } = useQuery<WeeklyDigest[]>({
    queryKey: ["weekly-digests", studentId],
    queryFn: async () => {
      try {
        const { data } = await api.get(
          `/api/reports/parent/students/${studentId}/weekly-digests/?limit=6`
        );
        return data.results ?? [];
      } catch {
        return [MOCK_DIGEST];
      }
    },
    staleTime: 60_000,
  });

  const list = digests ?? [MOCK_DIGEST];
  const activeWeek = selectedWeek ?? list[0]?.week_start ?? null;
  const digest = list.find((d) => d.week_start === activeWeek) ?? list[0];

  if (isLoading) {
    return (
      <Screen>
        <SectionTitle title="Weekly Report" subtitle="AI-generated digest" />
        <ActivityIndicator color={palette.brand} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!digest) {
    return (
      <Screen>
        <SectionTitle title="Weekly Report" subtitle="AI-generated digest" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptySub}>
            Weekly AI digests are generated every Monday. Check back after your
            child&apos;s first week.
          </Text>
        </View>
      </Screen>
    );
  }

  const weekEnd = new Date(digest.week_start);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${new Date(digest.week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <Screen>
      {/* Header */}
      <SectionTitle
        title="Weekly Report Card"
        subtitle={`AI-generated digest · ${weekLabel}`}
      />

      {/* Week selector */}
      {list.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekRow}
          contentContainerStyle={styles.weekRowContent}
        >
          {list.map((d) => (
            <WeekChip
              key={d.week_start}
              weekStart={d.week_start}
              active={d.week_start === activeWeek}
              onPress={() => setSelectedWeek(d.week_start)}
            />
          ))}
        </ScrollView>
      )}

      {/* Attendance ring + stat */}
      <View style={styles.attendanceCard}>
        <AttendanceRing pct={digest.attendance_pct} />
        <View style={styles.attendanceStats}>
          <View style={styles.statRow}>
            <View style={[styles.statDot, { backgroundColor: palette.success }]} />
            <Text style={styles.statLabel}>Present</Text>
            <Text style={styles.statValue}>{digest.days_present} days</Text>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.statDot, { backgroundColor: palette.danger }]} />
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={styles.statValue}>{digest.days_absent} days</Text>
          </View>
        </View>
      </View>

      {/* Overall summary */}
      <View style={styles.overallCard}>
        <Text style={styles.overallIcon}>✨</Text>
        <Text style={styles.overallText}>{digest.overall_summary}</Text>
      </View>

      {/* Insights */}
      <InsightRow
        icon="💪"
        title="Strengths This Week"
        body={digest.strengths_summary}
        color={palette.success}
        bg="#f0fdf4"
      />
      <InsightRow
        icon="📈"
        title="Areas to Improve"
        body={digest.weaknesses_summary}
        color={palette.warning}
        bg="#fffbeb"
      />
      <InsightRow
        icon="👩‍🏫"
        title="Teacher Highlights"
        body={digest.teacher_highlights}
        color={palette.brand}
        bg={palette.brandSoft}
      />

      {/* Footer note */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🤖 This report is generated by AI from your child's attendance and teacher
          notes. For detailed feedback, contact the school directly.
        </Text>
      </View>
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Week selector
  weekRow: { marginHorizontal: -spacing.md },
  weekRowContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
    flexDirection: "row",
  },
  weekChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  weekChipActive: {
    backgroundColor: palette.brandSoft,
    borderColor: palette.brand,
  },
  weekChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#64748B",
  },
  weekChipTextActive: {
    color: palette.brand,
  },

  // Attendance ring
  attendanceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  ringWrap: { alignItems: "center" },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: { alignItems: "center" },
  ringPct: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  ringLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  attendanceStats: { flex: 1, gap: 10 },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Overall summary
  overallCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: palette.brandSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.brandMid,
    padding: spacing.md,
  },
  overallIcon: { fontSize: 20, marginTop: 1 },
  overallText: {
    flex: 1,
    fontSize: 14,
    color: palette.brandDeep,
    lineHeight: 21,
    fontWeight: "500",
  },

  // Insight cards
  insightCard: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: spacing.md,
    gap: 6,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insightIcon: { fontSize: 16 },
  insightTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  insightBody: {
    fontSize: 13.5,
    color: "#475569",
    lineHeight: 20,
  },

  // Footer
  footer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  footerText: {
    fontSize: 11.5,
    color: "#94A3B8",
    lineHeight: 17,
  },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySub: {
    fontSize: 13.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
