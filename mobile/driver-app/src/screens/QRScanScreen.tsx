import { CameraView, useCameraPermissions } from "expo-camera";
import { ArrowLeft, CheckCircle2, QrCode, UserPlus, XCircle } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDriverDashboard } from "../hooks/useDriverDashboard";
import { api } from "../lib/api";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type ScanState = "idle" | "scanning" | "success" | "error";

export function QRScanScreen({ navigation }: { navigation?: any }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [resultMessage, setResultMessage] = useState("");
  const isProcessing = useRef(false);

  const { data: dashData } = useDriverDashboard();
  const driverId = dashData?.driverId ?? null;
  const routeId = dashData?.trip?.routeId ?? null;

  async function handleBarCodeScanned({ data: token }: { data: string }) {
    if (isProcessing.current || scanState !== "idle") return;
    isProcessing.current = true;
    setScanState("scanning");

    try {
      const { data: res } = await api.post("/api/transport/qr/scan/", {
        token,
        driver_id: driverId,
        route_id: routeId,
      });
      setResultMessage(`${res.student?.name ?? "Student"} added to ${res.route?.name}`);
      setScanState("success");
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? "Failed to scan QR code.";
      setResultMessage(msg);
      setScanState("error");
    }
  }

  function resetScan() {
    isProcessing.current = false;
    setScanState("idle");
    setResultMessage("");
  }

  // Permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <QrCode size={48} color={palette.brand} strokeWidth={1.5} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          Requesting camera permission…
        </Text>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <QrCode size={48} color={palette.inkFaint} strokeWidth={1.5} />
        <Text style={styles.permissionTitle}>Camera access required</Text>
        <Text style={styles.permissionBody}>
          Skippo needs your camera to scan student QR codes. Please grant permission to continue.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={styles.grantBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={14} color={palette.inkSoft} strokeWidth={2} />
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera fill */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanState === "idle" ? handleBarCodeScanned : undefined}
      />

      {/* Overlay */}
      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Scan Student QR</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderArea}>
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {scanState === "scanning" && (
              <View style={styles.scanningBadge}>
                <Text style={styles.scanningText}>Processing…</Text>
              </View>
            )}
          </View>
          <Text style={styles.hint}>
            Point the camera at the student's QR code
          </Text>
        </View>

        {/* Result sheet */}
        {scanState === "success" && (
          <View style={styles.resultSheet}>
            <View style={styles.resultIconWrap}>
              <CheckCircle2 size={36} color={palette.success} strokeWidth={2} />
            </View>
            <View style={styles.resultTextBlock}>
              <Text style={styles.resultTitle}>Student Added!</Text>
              <Text style={styles.resultSub}>{resultMessage}</Text>
            </View>
            <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan} activeOpacity={0.85}>
              <QrCode size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.scanAgainText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanState === "error" && (
          <View style={[styles.resultSheet, styles.resultSheetError]}>
            <View style={[styles.resultIconWrap, { backgroundColor: palette.dangerSoft }]}>
              <XCircle size={36} color={palette.danger} strokeWidth={2} />
            </View>
            <View style={styles.resultTextBlock}>
              <Text style={[styles.resultTitle, { color: palette.danger }]}>Scan Failed</Text>
              <Text style={styles.resultSub}>{resultMessage}</Text>
            </View>
            <TouchableOpacity
              style={[styles.scanAgainBtn, { backgroundColor: palette.danger }]}
              onPress={resetScan}
              activeOpacity={0.85}
            >
              <QrCode size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.scanAgainText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanState === "idle" && (
          <View style={styles.idleSheet}>
            <UserPlus size={18} color={palette.inkSoft} strokeWidth={2} />
            <Text style={styles.idleSheetText}>Ready to scan student QR codes</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permissionContainer: {
    flex: 1,
    backgroundColor: palette.canvas,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  permissionTitle: { fontSize: 20, fontWeight: "800", color: palette.ink, textAlign: "center" },
  permissionBody: { fontSize: 14, color: palette.inkSoft, textAlign: "center", lineHeight: 22 },
  grantBtn: {
    backgroundColor: palette.brand,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  grantBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  backLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  backLinkText: { fontSize: 13, color: palette.inkSoft },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  viewfinderArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  viewfinder: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#fff",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  scanningBadge: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scanningText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  hint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: spacing.xl,
  },
  resultSheet: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#fff",
    margin: spacing.md,
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  resultSheetError: { borderWidth: 1.5, borderColor: "#FECACA" },
  resultIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultTextBlock: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: "800", color: palette.ink },
  resultSub: { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  scanAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.brand,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scanAgainText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  idleSheet: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  idleSheetText: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
});
