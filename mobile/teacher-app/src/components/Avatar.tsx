import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { palette } from "../theme/palette";
import { radius } from "../theme/spacing";

const COLORS = [
  { bg: "#d6ede1", text: "#124d2b" },
  { bg: "#dceefb", text: "#1a5c8f" },
  { bg: "#fdefd4", text: "#b06d00" },
  { bg: "#fce8e6", text: "#c0392b" },
  { bg: "#ede8fc", text: "#5b3fa8" },
];

type AvatarProps = { name: string; size?: number; style?: ViewStyle };

export function Avatar({ name, size = 40, style }: AvatarProps) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color.bg },
        style,
      ]}
    >
      <Text style={[styles.initials, { color: color.text, fontSize: size * 0.36 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: "center", justifyContent: "center" },
  initials: { fontWeight: "800" },
});
