// ---------------------------------------------------------------------------
// StudentActivitySections – "Online Tests" and "AI Classes" sections rendered
// inside the Academics tab for each linked student.
//
// Online test flow:  push notification → Academics tab → Start Test
//                    → POST access endpoint → open exam URL in the browser
// AI class flow:     class goes active → Join Class → open pod join URL
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Bot, MonitorPlay } from "lucide-react-native";

import {
  AIClassToken,
  OnlineTestAccess,
  requestTestAccess,
} from "../hooks/useStudentActivities";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtWindow(from: string, until: string) {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${new Date(from).toLocaleString("en-IN", opts)} – ${new Date(until).toLocaleString("en-IN", opts)}`;
}

type TestState = "upcoming" | "active" | "done" | "expired";

function testState(t: OnlineTestAccess): TestState {
  if (t.is_used) return "done";
  const now = Date.now();
  if (now < new Date(t.available_from).getTime()) return "upcoming";
  if (now > new Date(t.available_until).getTime()) return "expired";
  return "active";
}

const TEST_STATE_META: Record<TestState, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: palette.brand },
  active: { label: "Open now", color: palette.green },
  done: { label: "Submitted", color: palette.inkSoft },
  expired: { label: "Window closed", color: palette.inkFaint },
};

async function openUrl(url: string) {
  if (Platform.OS === "web") {
    window.open(url, "_blank", "noopener");
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

function showError(title: string, message: string) {
  if (Platform.OS === "web") {
    // Alert.alert is a no-op on react-native-web
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// ── Section header (matches AcademicsScreen style) ────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: typeof Bot; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon size={16} color={palette.brand} strokeWidth={2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ── Online Tests ──────────────────────────────────────────────────────────────

function TestCard({ test, studentId }: { test: OnlineTestAccess; studentId: number }) {
  const schoolSlug = useSessionStore((s) => s.schoolSlug);
  const [starting, setStarting] = useState(false);
  const state = testState(test);
  const meta = TEST_STATE_META[state];

  const startTest = async () => {
    setStarting(true);
    try {
      const examUrl = await requestTestAccess(schoolSlug, studentId, test.test_id);
      await openUrl(examUrl);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (e as any)?.response?.data?.detail;
      showError(
        "Could not start the test",
        detail ?? "The exam server is not available right now. Please try again in a moment.",
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{test.test_title}</Text>
        <View style={[styles.statePill, { backgroundColor: meta.color + "1A" }]}>
          <Text style={[styles.stateText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <Text style={styles.cardMeta}>
        {test.test_type === "mcq"
          ? "Multiple choice"
          : test.test_type === "voice"
            ? "Voice answers"
            : "MCQ + voice"}{" "}
        · {test.duration_minutes} min
      </Text>
      <Text style={styles.cardWindow}>{fmtWindow(test.available_from, test.available_until)}</Text>

      {test.instructions ? <Text style={styles.instructions}>{test.instructions}</Text> : null}

      {state === "active" && (
        <Pressable
          onPress={startTest}
          disabled={starting}
          style={({ pressed }) => [
            styles.primaryBtn,
            (pressed || starting) && { opacity: 0.7 },
          ]}
        >
          <MonitorPlay size={16} color="#fff" strokeWidth={2.2} />
          <Text style={styles.primaryBtnText}>{starting ? "Preparing exam…" : "Start Test"}</Text>
        </Pressable>
      )}
      {state === "upcoming" && (
        <Text style={styles.hintText}>The Start button appears when the test window opens.</Text>
      )}
      {state === "done" && (
        <Text style={styles.hintText}>Submitted — the result appears here once published.</Text>
      )}
    </View>
  );
}

// ── AI Classes ────────────────────────────────────────────────────────────────

function AIClassCard({ cls }: { cls: AIClassToken }) {
  const [joining, setJoining] = useState(false);
  const isLive = cls.class_status === "active" && Boolean(cls.join_url);

  const join = async () => {
    if (!cls.join_url) return;
    setJoining(true);
    try {
      await openUrl(cls.join_url);
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{cls.class_title}</Text>
        {isLive && (
          <View style={[styles.statePill, { backgroundColor: palette.green + "1A" }]}>
            <Text style={[styles.stateText, { color: palette.green }]}>● LIVE</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardMeta}>{cls.subject} · AI Teacher</Text>
      {cls.scheduled_at ? (
        <Text style={styles.cardWindow}>
          Scheduled: {new Date(cls.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
        </Text>
      ) : null}

      {isLive ? (
        <Pressable
          onPress={join}
          disabled={joining}
          style={({ pressed }) => [styles.primaryBtn, (pressed || joining) && { opacity: 0.7 }]}
        >
          <Bot size={16} color="#fff" strokeWidth={2.2} />
          <Text style={styles.primaryBtnText}>{joining ? "Opening…" : "Join Class"}</Text>
        </Pressable>
      ) : (
        <Text style={styles.hintText}>The Join button appears when the class goes live.</Text>
      )}
    </View>
  );
}

// ── Exported sections ─────────────────────────────────────────────────────────

export function OnlineTestsSection({
  tests,
  studentId,
}: {
  tests: OnlineTestAccess[];
  studentId: number;
}) {
  if (tests.length === 0) return null;
  return (
    <>
      <SectionHeader icon={MonitorPlay} title="Online Tests" />
      {tests.map((t) => (
        <TestCard key={t.token} test={t} studentId={studentId} />
      ))}
    </>
  );
}

export function AIClassesSection({ classes }: { classes: AIClassToken[] }) {
  if (classes.length === 0) return null;
  return (
    <>
      <SectionHeader icon={Bot} title="AI Classes" />
      {classes.map((c) => (
        <AIClassCard key={c.id} cls={c} />
      ))}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.ink,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.stroke,
    gap: 6,
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: palette.ink, flex: 1 },
  statePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  stateText: { fontSize: 11, fontWeight: "800" },
  cardMeta: { fontSize: 12, color: palette.inkSoft },
  cardWindow: { fontSize: 12, color: palette.inkFaint },
  instructions: { fontSize: 12, color: palette.inkSoft, fontStyle: "italic", lineHeight: 17 },

  primaryBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.brand,
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  hintText: { fontSize: 12, color: palette.inkFaint, marginTop: 2 },
});
