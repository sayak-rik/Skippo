/**
 * Web stub for react-native-maps.
 * react-native-maps is native-only; this placeholder renders in the web dev
 * preview so the bundler doesn't fail on Platform/native internals.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";

function MapView({ style, children }) {
  return (
    <View style={[styles.shell, style]}>
      <Text style={styles.icon}>🗺</Text>
      <Text style={styles.label}>Live map — open on your phone</Text>
      <Text style={styles.sub}>Map view is available on iOS & Android only</Text>
      {children}
    </View>
  );
}

function Marker() { return null; }
function Polyline() { return null; }
function Circle() { return null; }
function Callout() { return null; }

MapView.Marker   = Marker;
MapView.Polyline = Polyline;
MapView.Circle   = Circle;
MapView.Callout  = Callout;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 200,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  icon:  { fontSize: 32 },
  label: { fontSize: 13, fontWeight: "700", color: "#6366f1" },
  sub:   { fontSize: 11, color: "#475569", textAlign: "center", paddingHorizontal: 24 },
});

export default MapView;
export { Marker, Polyline, Circle, Callout };
