import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Mail } from "lucide-react-native";

import { Screen } from "../components/Screen";
import { useParentMessages } from "../hooks/useParentFeeds";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function MessagesScreen() {
  const { data } = useParentMessages();

  if (!data) {
    return null;
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerDot} />
        </View>
        <Text style={styles.headerSub}>School updates, reminders, and partner notices</Text>
      </View>

      {/* Message list */}
      {data.map((message: { id: number; title: string; body: string; tag: string; createdAt: string; isRead: boolean }) => (
        <View key={message.id} style={styles.card}>
          <View style={styles.cardLeft}>
            <View style={[styles.unreadDot, message.isRead ? styles.dotRead : styles.dotUnread]} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, !message.isRead && styles.cardTitleUnread]} numberOfLines={1}>
                {message.title}
              </Text>
              <Text style={styles.cardTime}>{formatTime(message.createdAt)}</Text>
            </View>
            <Text style={styles.cardBodyText} numberOfLines={2}>{message.body}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.tagChip}>
                <Text style={styles.tagChipText}>{message.tag}</Text>
              </View>
              {!message.isRead && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      ))}

      {data.length === 0 && (
        <View style={styles.emptyWrap}>
          <Mail size={40} color={palette.inkFaint} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySub}>School notices and updates will appear here.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Header
  headerWrap: { gap: 3 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.4,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.brand,
    marginTop: 2,
  },
  headerSub: {
    fontSize: 13,
    color: palette.inkSoft,
    fontWeight: "400",
    lineHeight: 18,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  cardLeft: {
    width: 4,
    alignItems: "center",
    paddingTop: spacing.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    top: spacing.md + 4,
    left: -2,
  },
  dotUnread: { backgroundColor: palette.brand },
  dotRead: { backgroundColor: palette.stroke },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: palette.ink,
    letterSpacing: -0.1,
  },
  cardTitleUnread: {
    fontWeight: "800",
  },
  cardTime: {
    fontSize: 11,
    color: palette.inkFaint,
    fontWeight: "500",
  },
  cardBodyText: {
    fontSize: 13,
    color: palette.inkSoft,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.brandMid,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.brandDeep,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.brand,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.ink,
  },
  emptySub: {
    fontSize: 13,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 19,
  },
});
