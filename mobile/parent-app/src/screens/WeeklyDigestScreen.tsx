// ---------------------------------------------------------------------------
// WeeklyDigestScreen – AI-generated weekly report card for parents.
//
// Shows the most recent weekly digest for the parent's child:
//   • Attendance summary (present / absent days + percentage)
//   • AI-written strengths, weaknesses, and teacher highlights
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
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
} from "lucide-react-native";
import { Screen } from "../components/Screen";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { api } from "../lib/api";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeeklyDigest {
  id: number;
  weekOf: string;
  attendancePercent: number;
  insights: {
    strengths: string;
    weaknesses: string;
    teacherHighlights: string;
  };
}

// ── Attendance Ring ───────────────────────────────────────────────────────────

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

// ── Insight Card ──────────────────────────────────────────────────────────────

function InsightCard({
  Icon,
  title,
  body,
  accentColor,
  bgColor,
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  title: string;
  body: string;
  accentColor: string;
  bgColor: string;
}) {
  if (!body) return null;
  return (
    <View style={[styles.insightCard, { borderLeftColor: accentColor, backgroundColor: bgColor }]}>
      <View style={styles.insightHeader}>
        <Icon size={16} color={accentColor} strokeWidth={2} />
        <Text style={[styles.insightTitle, { color: accentColor }]}>{title}</Text>
      </View>
      <Text style={styles.insightBody}>{body}</Text>
    </View>
  );
}

// ── Week Chip ─────────────────────────────────────────────────────────────────

function WeekChip({
  weekOf,
  active,
  onPress,
}: {
  weekOf: string;
  active: boolean;
  onPress: () => void;
}) {
  const d = new Date(weekOf);
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

// ── WeeklyDigestScreen ────────────────────────────────────────────────────────

export function WeeklyDigestScreen() {
  const { data: dashboard } = useParentDashboard();
  const studentId = (dashboard as any)?.student?.id ?? 1;
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const { data: digests, isLoading } = useQuery<WeeklyDigest[]>({
    queryKey: ["weekly-digests", studentId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/reports/parent/students/${studentId}/weekly-digests/?limit=6`
      );
      return data.results ?? [];
    },
    staleTime: 60_000,
  });

  const list = digests ?? [];
  const activeWeek = selectedWeek ?? list[0]?.weekOf ?? null;
  const digest = list.find((d) => d.weekOf === activeWeek) ?? list[0];

  // Loading state
  if (isLoading) {
    return (
      <Screen>
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>Weekly Report</Text>
          <Text style={styles.headerSub}>AI-generated digest</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={styles.loadingText}>Loading your report…</Text>
        </View>
      </Screen>
    );
  }

  // Empty state
  if (!digest) {
    return (
      <Screen>
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>Weekly Report</Text>
          <Text style={styles.headerSub}>AI-generated digest</Text>
        </View>
        <View style={styles.emptyWrap}>
          <BarChart2 size={48} color={palette.inkFaint} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No weekly report yet</Text>
          <Text style={styles.emptySub}>
            Weekly AI digests are generated every Monday. Check back after your
            child's first week.
          </Text>
        </View>
      </Screen>
    );
  }

  const weekEnd = new Date(digest.weekOf);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${new Date(digest.weekOf).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })} – ${weekEnd.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.headerWrap}>
        <Text style={styles.headerTitle}>Weekly Report</Text>
        <Text style={styles.headerSub}>AI-generated digest · {weekLabel}</Text>
      </View>

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
              key={d.weekOf}
              weekOf={d.weekOf}
              active={d.weekOf === activeWeek}
              onPress={() => setSelectedWeek(d.weekOf)}
            />
          ))}
        </ScrollView>
      )}

      {/* Attendance ring */}
      <View style={styles.attendanceCard}>
        <AttendanceRing pct={digest.attendancePercent} />
        <View style={styles.attendanceInfo}>
          <Text style={styles.attendanceHeading}>Attendance</Text>
          <Text style={styles.attendanceWeek}>Week of {weekLabel}</Text>
          <View style={styles.attendancePctRow}>
            <View
              style={[
                styles.attendancePill,
                {
                  backgroundColor:
                    digest.attendancePercent >= 90
                      ? "#ECFDF5"
                      : digest.attendancePercent >= 75
                      ? "#FFFBEB"
                      : "#FFF5F5",
                },
              ]}
            >
              <Text
                style={[
                  styles.attendancePillText,
                  {
                    color:
                      digest.attendancePercent >= 90
                        ? palette.success
                        : digest.attendancePercent >= 75
                        ? palette.warning
                        : palette.danger,
                  },
                ]}
              >
                {digest.attendancePercent >= 90
                  ? "Excellent"
                  : digest.attendancePercent >= 75
                  ? "Good"
                  : "Needs attention"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Insights */}
      <InsightCard
        Icon={TrendingUp}
        title="Strengths This Week"
        body={digest.insights.strengths}
        accentColor={palette.success}
        bgColor="#F0FDF4"
      />
      <InsightCard
        Icon={TrendingDown}
        title="Areas to Improve"
        body={digest.insights.weaknesses}
        accentColor={palette.warning}
        bgColor="#FFFBEB"
      />
      <InsightCard
        Icon={Star}
        title="Teacher Highlights"
        body={digest.insights.teacherHighlights}
        accentColor={palette.brand}
        bgColor={palette.brandSoft}
      />

      {/* Footer note */}
      <View style={styles.footer}>
        <Zap size={13} color={palette.inkFaint} strokeWidth={2} />
        <Text style={styles.footerText}>
          This report is generated by AI from your child's attendance and teacher
          notes. For detailed feedback, contact the school directly.
        </Text>
      </View>
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  headerWrap: { gap: 3 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: palette.inkSoft,
    fontWeight: "400",
    lineHeight: 18,
  },

  // Loading
  loadingWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: palette.inkSoft,
  },

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
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  weekChipActive: {
    backgroundColor: palette.brandMid,
    borderColor: palette.brand,
  },
  weekChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: palette.inkSoft,
  },
  weekChipTextActive: {
    color: palette.brand,
  },

  // Attendance card
  attendanceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
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
    color: palette.inkFaint,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  attendanceInfo: { flex: 1, gap: 4 },
  attendanceHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.ink,
    letterSpacing: -0.2,
  },
  attendanceWeek: {
    fontSize: 12,
    color: palette.inkSoft,
  },
  attendancePctRow: { marginTop: 4 },
  attendancePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  attendancePillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Insight cards
  insightCard: {
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insightTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  insightBody: {
    fontSize: 13.5,
    color: palette.inkSoft,
    lineHeight: 20,
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: palette.surfaceMuted,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  footerText: {
    flex: 1,
    fontSize: 11.5,
    color: palette.inkFaint,
    lineHeight: 17,
  },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.ink,
  },
  emptySub: {
    fontSize: 13.5,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
