import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
}>;

export function Screen({ children, scroll = true, padded = true }: ScreenProps) {
  const content = (
    <View style={[styles.content, !padded && styles.contentNoPad]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {scroll
        ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {content}
          </ScrollView>
        : content
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  contentNoPad: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
