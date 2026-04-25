// ---------------------------------------------------------------------------
// AIAssistantScreen – Gemini-powered teaching assistant.
//
// Features:
//   1. Token budget bar — shows daily AI tokens remaining (school-configurable).
//   2. Lesson Plan tab — generate a structured lesson plan by subject + topic.
//   3. Class Summary tab — generate end-of-day summary with weak students +
//      revision topic suggestions for the active classroom.
//   4. Voice Observation tab — teacher dictates an observation, AI structures
//      it into a professional note and saves it to the student's progress feed.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { api } from "../lib/api";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "lesson" | "summary" | "voice";

interface TokenStatus {
  used: number;
  limit: number;
  remaining: number;
}

interface LessonPlanResult {
  id: number;
  subject: string;
  topic: string;
  duration_minutes: number;
  content: string;
}

interface ClassSummaryResult {
  id: number;
  date: string;
  summary: string;
  weak_students: string[];
  revision_topics: string[];
}

interface VoiceObservationResult {
  id: number;
  structured_note: string;
  category: string;
  student: string;
}

// ── Token Bar ─────────────────────────────────────────────────────────────────

function TokenBar({ tokens }: { tokens: TokenStatus }) {
  const pct = tokens.limit > 0 ? (tokens.used / tokens.limit) * 100 : 0;
  const color =
    tokens.remaining === 0
      ? palette.danger
      : tokens.remaining <= 1
      ? palette.warning
      : palette.brand;

  return (
    <Card compact>
      <View style={styles.tokenRow}>
        <Text style={styles.tokenLabel}>✨ Daily AI Tokens</Text>
        <Text style={[styles.tokenCount, { color }]}>
          {tokens.remaining}/{tokens.limit} remaining
        </Text>
      </View>
      <View style={styles.tokenTrack}>
        <View
          style={[
            styles.tokenFill,
            { width: `${pct}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      {tokens.remaining === 0 && (
        <Text style={styles.tokenExhausted}>
          Token limit reached. Resets at midnight.
        </Text>
      )}
    </Card>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "lesson",  label: "Lesson Plan",  icon: "📚" },
  { key: "summary", label: "Class Summary", icon: "📋" },
  { key: "voice",   label: "Voice Note",   icon: "🎙" },
];

function TabBar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tab, active === t.key && styles.tabActive]}
          onPress={() => onSelect(t.key)}
          activeOpacity={0.75}
        >
          <Text style={styles.tabIcon}>{t.icon}</Text>
          <Text style={[styles.tabLabel, active === t.key && styles.tabLabelActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card accentColor={palette.brand}>
      <Text style={styles.resultTitle}>{title}</Text>
      {children}
    </Card>
  );
}

// ── Lesson Plan Tab ───────────────────────────────────────────────────────────

function LessonPlanTab({ disabled }: { disabled: boolean }) {
  const [subject, setSubject]   = useState("");
  const [topic, setTopic]       = useState("");
  const [duration, setDuration] = useState("45");
  const [result, setResult]     = useState<LessonPlanResult | null>(null);
  const qc = useQueryClient();

  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/api/academics/teacher/ai/lesson-plan/", {
        subject,
        topic,
        duration_minutes: parseInt(duration, 10) || 45,
      });
      return data as LessonPlanResult;
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["ai-tokens"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "Failed to generate. Try again.";
      Alert.alert("AI Error", msg);
    },
  });

  return (
    <View style={styles.tabContent}>
      <Text style={styles.fieldLabel}>Subject</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Mathematics"
        placeholderTextColor={palette.inkDim}
        value={subject}
        onChangeText={setSubject}
      />

      <Text style={styles.fieldLabel}>Topic</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Quadratic Equations"
        placeholderTextColor={palette.inkDim}
        value={topic}
        onChangeText={setTopic}
      />

      <Text style={styles.fieldLabel}>Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        placeholder="45"
        placeholderTextColor={palette.inkDim}
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
      />

      <PrimaryButton
        label="Generate Lesson Plan"
        loading={generate.isPending}
        disabled={disabled || !subject.trim() || !topic.trim()}
        onPress={() => generate.mutate()}
      />

      {result && (
        <ResultCard title={`📚 ${result.subject}: ${result.topic}`}>
          <Text style={styles.resultContent}>{result.content}</Text>
        </ResultCard>
      )}
    </View>
  );
}

// ── Class Summary Tab ─────────────────────────────────────────────────────────

function ClassSummaryTab({ disabled }: { disabled: boolean }) {
  const activeSessionId = useTeacherSessionStore((s) => s.activeSessionId);
  const [result, setResult]     = useState<ClassSummaryResult | null>(null);
  const qc = useQueryClient();

  const generate = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      if (activeSessionId) payload.classroom_id = activeSessionId;
      const { data } = await api.post(
        "/api/academics/teacher/ai/class-summary/",
        payload
      );
      return data as ClassSummaryResult;
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["ai-tokens"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "Failed to generate. Try again.";
      Alert.alert("AI Error", msg);
    },
  });

  return (
    <View style={styles.tabContent}>
      <Text style={styles.helperText}>
        Generates an AI summary for your active class, identifying students who
        may need extra support and topics to revise next session.
      </Text>

      <PrimaryButton
        label="Generate Class Summary"
        loading={generate.isPending}
        disabled={disabled}
        onPress={() => generate.mutate()}
      />

      {result && (
        <>
          <ResultCard title="📋 Today's Class Summary">
            <Text style={styles.resultContent}>{result.summary}</Text>
          </ResultCard>

          {result.weak_students.length > 0 && (
            <ResultCard title="⚠️ Students Needing Support">
              {result.weak_students.map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{s}</Text>
                </View>
              ))}
            </ResultCard>
          )}

          {result.revision_topics.length > 0 && (
            <ResultCard title="🔄 Topics to Revise">
              {result.revision_topics.map((t, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: palette.info }]} />
                  <Text style={styles.bulletText}>{t}</Text>
                </View>
              ))}
            </ResultCard>
          )}
        </>
      )}
    </View>
  );
}

// ── Voice Observation Tab ─────────────────────────────────────────────────────

function VoiceObservationTab({ disabled }: { disabled: boolean }) {
  const [transcript, setTranscript] = useState("");
  const [result, setResult]         = useState<VoiceObservationResult | null>(null);
  const qc = useQueryClient();

  const log = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        "/api/academics/teacher/ai/voice-observation/",
        { transcript }
      );
      return data as VoiceObservationResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setTranscript("");
      qc.invalidateQueries({ queryKey: ["ai-tokens"] });
      qc.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "Failed to log. Try again.";
      Alert.alert("AI Error", msg);
    },
  });

  return (
    <View style={styles.tabContent}>
      <Text style={styles.helperText}>
        Speak or type your observation. AI will structure it into a professional
        teacher note and save it to the student's parent-visible progress feed.
      </Text>

      <Text style={styles.fieldLabel}>What did you observe?</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder='e.g. "Arjun was distracted today but answered the last question correctly"'
        placeholderTextColor={palette.inkDim}
        value={transcript}
        onChangeText={setTranscript}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <PrimaryButton
        label="Log Observation"
        loading={log.isPending}
        disabled={disabled || !transcript.trim()}
        onPress={() => log.mutate()}
      />

      {result && (
        <ResultCard title={`🎙 Note saved for ${result.student}`}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{result.category}</Text>
          </View>
          <Text style={styles.resultContent}>{result.structured_note}</Text>
          <Text style={styles.savedNote}>✓ Saved to parent progress feed</Text>
        </ResultCard>
      )}
    </View>
  );
}

// ── AIAssistantScreen ─────────────────────────────────────────────────────────

export function AIAssistantScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("lesson");

  const { data: tokens, isLoading: tokensLoading } = useQuery<TokenStatus>({
    queryKey: ["ai-tokens"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/academics/teacher/ai/tokens/");
        return data;
      } catch {
        return { used: 0, limit: 5, remaining: 5 };
      }
    },
    staleTime: 10_000,
  });

  const tokensExhausted = tokens ? tokens.remaining === 0 : false;

  return (
    <Screen>
      <SectionTitle
        title="AI Assistant"
        subtitle="Powered by Gemini · generates lesson plans, summaries & observation notes"
      />

      {tokensLoading ? (
        <ActivityIndicator color={palette.brand} />
      ) : tokens ? (
        <TokenBar tokens={tokens} />
      ) : null}

      <TabBar active={activeTab} onSelect={setActiveTab} />

      {activeTab === "lesson"  && <LessonPlanTab  disabled={tokensExhausted} />}
      {activeTab === "summary" && <ClassSummaryTab disabled={tokensExhausted} />}
      {activeTab === "voice"   && <VoiceObservationTab disabled={tokensExhausted} />}
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Token bar
  tokenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.ink,
  },
  tokenCount: {
    fontSize: 13,
    fontWeight: "800",
  },
  tokenTrack: {
    height: 6,
    backgroundColor: palette.stroke,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  tokenFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  tokenExhausted: {
    fontSize: 11.5,
    color: palette.danger,
    fontWeight: "600",
    marginTop: spacing.xs,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: palette.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.inkSoft,
  },
  tabLabelActive: {
    color: palette.ink,
    fontWeight: "800",
  },

  // Tab content
  tabContent: {
    gap: spacing.md,
  },
  helperText: {
    fontSize: 13,
    color: palette.inkSoft,
    lineHeight: 19,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.ink,
    marginBottom: -spacing.xs,
  },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.stroke,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.ink,
  },
  textarea: {
    minHeight: 100,
    paddingTop: 12,
  },

  // Results
  resultTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: palette.ink,
    letterSpacing: -0.1,
  },
  resultContent: {
    fontSize: 13.5,
    color: palette.inkSoft,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.warning,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 13,
    color: palette.inkSoft,
    flex: 1,
    lineHeight: 19,
  },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: palette.brandSoft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.brand,
    textTransform: "capitalize",
  },
  savedNote: {
    fontSize: 12,
    color: palette.success,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
});
