// ---------------------------------------------------------------------------
// AssistRequestsScreen – dedicated tab for parent assist (doubt) requests.
//
// Features:
//   1. Pending tab — lists all unresolved parent questions across all sessions,
//      sorted by time raised (oldest first for urgency).
//   2. Resolved tab — shows resolved requests with green checkmarks and teacher
//      replies.
//   3. Reply modal — tap a request to open a reply input, then mark resolved.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";
import { AssistRequest } from "../types";

// ── Data fetching ─────────────────────────────────────────────────────────────

function useAllAssistRequests() {
  return useQuery<AssistRequest[]>({
    queryKey: ["assist-requests-all"],
    queryFn: async () => {
      const { data } = await api.get("/api/academics/teacher/assist-requests/");
      return (data.results ?? []).map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        sessionId: r.session_id,
        question: r.question,
        status: r.status,
        teacherReply: r.teacher_reply ?? "",
        raisedAt: r.raised_at,
        resolvedAt: r.resolved_at ?? null,
      }));
    },
    staleTime: 20_000,
  });
}

// ── ReplyModal ────────────────────────────────────────────────────────────────

type ReplyModalProps = {
  request: AssistRequest | null;
  onClose: () => void;
  onResolved: () => void;
};

function ReplyModal({ request, onClose, onResolved }: ReplyModalProps) {
  const [reply, setReply]     = useState("");
  const [saving, setSaving]   = useState(false);
  const qc = useQueryClient();

  const resolve = useMutation({
    mutationFn: async () =>
      api.post(`/api/academics/teacher/assist-requests/${request!.id}/resolve/`, { reply }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assist-requests-all"] });
      onResolved();
      Alert.alert("Resolved", "The request has been marked as resolved.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "Failed to resolve. Try again.";
      Alert.alert("Error", msg);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await resolve.mutateAsync();
    } finally {
      setSaving(false);
    }
  };

  if (!request) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>Parent Question</Text>
            <Text style={styles.modalStudent}>
              {request.studentName} · {new Date(request.raisedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.questionBubble}>
          <Text style={styles.questionText}>{request.question}</Text>
        </View>

        <Text style={styles.replyLabel}>Reply to parent (optional)</Text>
        <TextInput
          style={styles.replyInput}
          placeholder="Type your response…"
          placeholderTextColor={palette.inkDim}
          multiline
          value={reply}
          onChangeText={setReply}
          autoFocus
        />

        <View style={styles.modalActions}>
          <PrimaryButton
            label="Cancel"
            variant="ghost"
            size="sm"
            onPress={onClose}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            label={saving ? "Saving…" : "Mark Resolved"}
            variant="primary"
            size="sm"
            onPress={handleSave}
            loading={saving}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── RequestCard ───────────────────────────────────────────────────────────────

type RequestCardProps = {
  request: AssistRequest;
  onPress: (r: AssistRequest) => void;
};

function RequestCard({ request, onPress }: RequestCardProps) {
  const resolved = request.status === "resolved";

  return (
    <TouchableOpacity activeOpacity={resolved ? 1 : 0.8} onPress={() => !resolved && onPress(request)}>
      <Card compact style={resolved ? styles.resolvedCard : styles.pendingCard}>
        <View style={styles.cardRow}>
          <Avatar name={request.studentName} size={36} />
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.studentName}>{request.studentName}</Text>
              {resolved ? (
                <View style={styles.resolvedBadge}>
                  <Text style={styles.resolvedBadgeText}>✓ Resolved</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Pending</Text>
                </View>
              )}
            </View>
            <Text style={styles.questionPreview} numberOfLines={2}>{request.question}</Text>
            {resolved && request.teacherReply ? (
              <Text style={styles.replyPreview} numberOfLines={1}>
                Your reply: {request.teacherReply}
              </Text>
            ) : null}
            <Text style={styles.timeText}>
              {new Date(request.raisedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </Text>
          </View>
        </View>
        {!resolved && (
          <View style={styles.tapHintRow}>
            <Text style={styles.tapHint}>Tap to reply & resolve →</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// ── AssistRequestsScreen ──────────────────────────────────────────────────────

export function AssistRequestsScreen() {
  const { data: requests = [], isLoading } = useAllAssistRequests();
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const [activeRequest, setActiveRequest] = useState<AssistRequest | null>(null);

  const pending  = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status === "resolved");
  const displayed = tab === "pending" ? pending : resolved;

  return (
    <Screen>
      {/* ── Header banner ────────────────────────────────────────────────── */}
      <View style={styles.headerBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Assist Requests</Text>
          <Text style={styles.headerSub}>Parent questions, waiting for your response</Text>
        </View>
        <View style={styles.headerBadgeWrap}>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 26 }}>🙋</Text>
          </View>
          {pending.length > 0 && (
            <View style={styles.pendingCountBadge}>
              <Text style={styles.pendingCountText}>{pending.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {(["pending", "resolved"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === "pending" ? `Pending${pending.length > 0 ? ` (${pending.length})` : ""}` : "Resolved"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <Card>
          <Text style={styles.emptyText}>Loading requests…</Text>
        </Card>
      ) : displayed.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>{tab === "pending" ? "🎉" : "📭"}</Text>
          <Text style={styles.emptyTitle}>
            {tab === "pending" ? "All caught up!" : "Nothing resolved yet"}
          </Text>
          <Text style={styles.emptySub}>
            {tab === "pending"
              ? "No pending parent questions. Great work!"
              : "Resolved questions will appear here."}
          </Text>
        </Card>
      ) : (
        displayed.map((r) => (
          <RequestCard key={r.id} request={r} onPress={setActiveRequest} />
        ))
      )}

      {/* ── Reply modal ─────────────────────────────────────────────────── */}
      <ReplyModal
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
        onResolved={() => setActiveRequest(null)}
      />
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  headerBanner: {
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    backgroundColor: "#ede8fc",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.lg + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderBottomWidth: 1.5,
    borderBottomColor: "#c084fc50",
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#7e22ce", letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: "#7e22ceaa", fontWeight: "500", marginTop: 3, lineHeight: 17 },
  headerBadgeWrap: { position: "relative" },
  headerIcon: {
    width: 54, height: 54,
    borderRadius: radius.md,
    backgroundColor: "#c084fc20",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingCountBadge: {
    position: "absolute",
    top: -4, right: -4,
    minWidth: 20, height: 20,
    borderRadius: 10,
    backgroundColor: "#7e22ce",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  pendingCountText: { fontSize: 11, fontWeight: "900", color: "#fff" },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
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
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.inkSoft,
  },
  tabLabelActive: {
    color: palette.ink,
    fontWeight: "800",
  },

  // Cards
  pendingCard:  { borderColor: palette.warning, borderWidth: 1.5 },
  resolvedCard: { borderColor: palette.success, borderWidth: 1 },

  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  cardContent: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 },
  studentName: { fontSize: 14, fontWeight: "800", color: palette.ink },

  pendingBadge: {
    backgroundColor: palette.warningSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: "800", color: palette.warning },

  resolvedBadge: {
    backgroundColor: palette.successSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  resolvedBadgeText: { fontSize: 10, fontWeight: "800", color: palette.success },

  questionPreview: { fontSize: 13, color: palette.inkSoft, lineHeight: 18 },
  replyPreview:    { fontSize: 12, color: palette.inkDim, fontStyle: "italic" },
  timeText:        { fontSize: 11, color: palette.inkDim, fontWeight: "500" },

  tapHintRow: { marginTop: spacing.xs, alignItems: "flex-end" },
  tapHint:    { fontSize: 11, color: palette.brand, fontWeight: "700" },

  // Empty states
  emptyText: { fontSize: 13, color: palette.inkDim, textAlign: "center" },
  emptyCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: palette.ink, textAlign: "center" },
  emptySub:   { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 19 },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle:     { fontSize: 17, fontWeight: "800", color: palette.ink },
  modalStudent:   { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  modalClose:     { padding: spacing.xs },
  modalCloseText: { fontSize: 16, color: palette.inkSoft, fontWeight: "700" },

  questionBubble: {
    backgroundColor: "#f5f0ff",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#d8ccf8",
  },
  questionText: { fontSize: 14, color: palette.ink, lineHeight: 21 },

  replyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  replyInput: {
    minHeight: 90,
    textAlignVertical: "top",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.ink,
    fontSize: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  modalActions: { flexDirection: "row", gap: spacing.sm },
});
