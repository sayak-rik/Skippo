import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type ScreenProps = PropsWithChildren<{ scroll?: boolean; padded?: boolean }>;

export function Screen({ children, scroll = true, padded = true }: ScreenProps) {
  const content = (
    <View style={[styles.content, !padded && styles.noPad]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  scroll: { flexGrow: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  noPad: { paddingHorizontal: 0, paddingTop: 0 },
});
