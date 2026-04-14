import { StyleSheet, Text, View } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useParentMessages } from "../hooks/useParentFeeds";
import { palette } from "../theme/palette";

export function MessagesScreen() {
  const { data } = useParentMessages();

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle title="Message Center" subtitle="School updates, reminders, and partner notices" />
      {data.map((message) => (
        <InfoCard key={message.id} title={message.title} subtitle={`${message.tag} • ${message.createdAt}`}>
          <Text style={styles.body}>{message.body}</Text>
          <View style={[styles.tag, message.isRead ? styles.readTag : styles.unreadTag]}>
            <Text style={styles.tagText}>{message.isRead ? "Read" : "New"}</Text>
          </View>
        </InfoCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    color: palette.inkSoft,
    lineHeight: 21,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  unreadTag: {
    backgroundColor: palette.brandSoft,
  },
  readTag: {
    backgroundColor: palette.surfaceMuted,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.brandDeep,
  },
});
