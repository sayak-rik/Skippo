// ---------------------------------------------------------------------------
// BroadcastScreen – dedicated tab for composing and reviewing class broadcasts.
//
// Features:
//   1. Classroom selector — pick any classroom from the teacher's list.
//   2. Compose form — type a message and send it to all parents in that class.
//   3. Broadcast history — shows all previous broadcasts for the selected class,
//      ordered newest first with delivery timestamps.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Alert,
  FlatList,
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
import { useClassrooms } from "../hooks/useTeacherDashboard";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";
import { ClassBroadcast, Classroom } from "../types";

// ── BroadcastScreen ───────────────────────────────────────────────────────────

export function BroadcastScreen() {
  const { data: classrooms = [], isLoading: classroomsLoading } = useClassrooms();
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const qc = useQueryClient();

  // Fetch broadcast history for the selected classroom (by classroom id, not session id)
  const { data: history = [], isLoading: historyLoading } = useQuery<ClassBroadcast[]>({
    queryKey: ["broadcasts-classroom", selectedClassroom?.id],
    enabled: selectedClassroom !== null,
    queryFn: async () => {
      const { data } = await api.get(
        `/api/academics/teacher/classrooms/${selectedClassroom!.id}/broadcasts/`
      );
      return (data.results ?? []).map((b: any) => ({
        id: b.id,
        sessionId: b.session_id,
        classroomLabel: b.classroom_label,
        message: b.message,
        sentAt: b.sent_at,
      }));
    },
    staleTime: 15_000,
  });

  const sendBroadcast = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/api/academics/teacher/classrooms/${selectedClassroom!.id}/broadcasts/`,
        { message: message.trim() }
      );
      return data;
    },
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["broadcasts-classroom", selectedClassroom?.id] });
      Alert.alert("Broadcast sent", "All parents in this class have been notified.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "Failed to send broadcast. Try again.";
      Alert.alert("Error", msg);
    },
  });

  const handleSend = async () => {
    if (!message.trim() || !selectedClassroom) return;
    setSending(true);
    try {
      await sendBroadcast.mutateAsync();
    } finally {
      setSending(false);
    }
  };

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Screen>
      {/* ── Header banner ────────────────────────────────────────────────── */}
      <View style={styles.headerBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Broadcasts</Text>
          <Text style={styles.headerSub}>Send class-wide messages to all parents instantly</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 28 }}>📢</Text>
        </View>
      </View>

      {/* ── Classroom picker ─────────────────────────────────────────────── */}
      <View>
        <Text style={styles.fieldLabel}>Select Classroom</Text>
        <FlatList
          data={classrooms}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classroomChips}
          renderItem={({ item }) => {
            const active = selectedClassroom?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedClassroom(item)}
                activeOpacity={0.8}
                style={[styles.classroomChip, active && styles.classroomChipActive]}
              >
                <Text style={[styles.classroomChipText, active && styles.classroomChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            classroomsLoading
              ? <Text style={styles.emptyText}>Loading classrooms…</Text>
              : <Text style={styles.emptyText}>No classrooms assigned.</Text>
          }
        />
      </View>

      {/* ── Compose ──────────────────────────────────────────────────────── */}
      {selectedClassroom && (
        <Card accentColor={palette.brand}>
          <Text style={styles.composeTitle}>
            Broadcast to {selectedClassroom.label}
          </Text>
          <Text style={styles.composeHint}>
            All parents in this class will receive a push notification instantly.
          </Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message…"
            placeholderTextColor={palette.inkDim}
            multiline
            value={message}
            onChangeText={setMessage}
          />
          <PrimaryButton
            label={sending ? "Sending…" : "Send Broadcast"}
            onPress={handleSend}
            loading={sending}
            disabled={!message.trim()}
          />
        </Card>
      )}

      {/* ── Broadcast history ─────────────────────────────────────────────── */}
      {selectedClassroom && (
        <>
          <SectionTitle
            title="History"
            subtitle={historyLoading ? "Loading…" : `${history.length} broadcast${history.length !== 1 ? "s" : ""} sent`}
          />

          {history.length === 0 && !historyLoading ? (
            <Card>
              <Text style={styles.emptyHistory}>No broadcasts sent yet for this class.</Text>
            </Card>
          ) : (
            history.map((b) => (
              <Card key={b.id} compact>
                <View style={styles.historyRow}>
                  <View style={styles.historyIconWrap}>
                    <Text style={styles.historyIcon}>📢</Text>
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyMessage}>{b.message}</Text>
                    <Text style={styles.historyTime}>{formatTime(b.sentAt)}</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </>
      )}

      {/* ── Empty state when no classroom selected ───────────────────────── */}
      {!selectedClassroom && !classroomsLoading && classrooms.length > 0 && (
        <Card style={styles.placeholderCard}>
          <Text style={styles.placeholderIcon}>📢</Text>
          <Text style={styles.placeholderTitle}>Pick a classroom to begin</Text>
          <Text style={styles.placeholderSub}>
            Select a class above to compose a broadcast or view history.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  headerBanner: {
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    backgroundColor: "#fff7ed",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.lg + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderBottomWidth: 1.5,
    borderBottomColor: "#fb923c50",
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#9a3412", letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: "#9a3412aa", fontWeight: "500", marginTop: 3, lineHeight: 17 },
  headerIcon: {
    width: 56, height: 56,
    borderRadius: radius.md,
    backgroundColor: "#fb923c20",
    alignItems: "center",
    justifyContent: "center",
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  classroomChips: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  classroomChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  classroomChipActive: {
    backgroundColor: palette.brand,
    borderColor: palette.brand,
  },
  classroomChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.inkSoft,
  },
  classroomChipTextActive: {
    color: "#fff",
  },
  emptyText: {
    fontSize: 13,
    color: palette.inkDim,
    paddingVertical: spacing.sm,
  },

  // Compose card
  composeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.ink,
    marginBottom: 2,
  },
  composeHint: {
    fontSize: 12,
    color: palette.inkSoft,
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.ink,
    fontSize: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
    marginBottom: spacing.sm,
  },

  // History
  emptyHistory: {
    fontSize: 13,
    color: palette.inkDim,
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: palette.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historyIcon: { fontSize: 16 },
  historyContent: { flex: 1, gap: 3 },
  historyMessage: {
    fontSize: 14,
    color: palette.ink,
    lineHeight: 20,
  },
  historyTime: {
    fontSize: 11,
    color: palette.inkDim,
    fontWeight: "500",
  },

  // Placeholder
  placeholderCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  placeholderIcon: { fontSize: 40 },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink,
    textAlign: "center",
  },
  placeholderSub: {
    fontSize: 13,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 19,
  },
});
