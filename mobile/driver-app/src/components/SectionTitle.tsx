import { StyleSheet, Text, View } from "react-native";

import { palette } from "../theme/palette";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink,
  },
  subtitle: {
    color: palette.inkSoft,
    fontSize: 13,
  },
});
