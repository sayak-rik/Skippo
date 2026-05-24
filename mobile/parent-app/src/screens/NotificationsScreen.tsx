import { StyleSheet, Text, View } from "react-native";
import { AlertCircle, AlertTriangle, Info } from "lucide-react-native";

import { Screen } from "../components/Screen";
import { useParentAlerts } from "../hooks/useParentFeeds";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type AlertLevel = "info" | "warning" | "critical" | string;

interface AlertItem {
  id: number;
  title: string;
  body: string;
  level: AlertLevel;
  createdAt: string;
}

function levelConfig(level: AlertLevel) {
  switch (level) {
    case "critical":
      return {
        borderColor: palette.danger,
        iconColor: palette.danger,
        bgColor: "#FFF5F5",
        Icon: AlertCircle,
        label: "Critical",
        labelColor: palette.danger,
      };
    case "warning":
      return {
        borderColor: palette.warning,
        iconColor: palette.warning,
        bgColor: "#FFFBEB",
        Icon: AlertTriangle,
        label: "Warning",
        labelColor: palette.warning,
      };
    default:
      return {
        borderColor: palette.brand,
        iconColor: palette.brand,
        bgColor: palette.brandSoft,
        Icon: Info,
        label: "Info",
        labelColor: palette.brand,
      };
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function NotificationsScreen() {
  const { data } = useParentAlerts();

  if (!data) {
    return null;
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.headerWrap}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSub}>Transport and safety notifications</Text>
      </View>

      {/* Alert list */}
      {data.map((alert: AlertItem) => {
        const cfg = levelConfig(alert.level);
        const { Icon } = cfg;
        return (
          <View
            key={alert.id}
            style={[
              styles.card,
              { borderLeftColor: cfg.borderColor, backgroundColor: cfg.bgColor },
            ]}
          >
            <View style={styles.cardHeader}>
              <Icon size={18} color={cfg.iconColor} strokeWidth={2} />
              <Text style={[styles.cardTitle, { color: palette.ink }]}>{alert.title}</Text>
              <Text style={styles.cardTime}>{formatTime(alert.createdAt)}</Text>
            </View>
            <Text style={styles.cardBody}>{alert.body}</Text>
            <View style={[styles.levelPill, { backgroundColor: cfg.borderColor + "1A" }]}>
              <Text style={[styles.levelText, { color: cfg.labelColor }]}>
                {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)}
              </Text>
            </View>
          </View>
        );
      })}

      {data.length === 0 && (
        <View style={styles.emptyWrap}>
          <Info size={40} color={palette.inkFaint} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No alerts</Text>
          <Text style={styles.emptySub}>Transport and safety notifications will appear here.</Text>
        </View>
      )}
    </Screen>
  );
}

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

  // Alert card
  card: {
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: spacing.md,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  cardTime: {
    fontSize: 11,
    color: palette.inkFaint,
    fontWeight: "500",
  },
  cardBody: {
    fontSize: 13,
    color: palette.inkSoft,
    lineHeight: 19,
  },
  levelPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
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
