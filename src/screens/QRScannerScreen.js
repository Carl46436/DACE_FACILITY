// ============================================================
// QR Scanner Screen
// Camera-based QR code scanner for item lookup
// ============================================================

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, spacing, borderRadius, fontSize } from "../theme/colors";
import Header from "../components/Header";
import CustomButton from "../components/CustomButton";
import { api } from "../services/api";

const QRScannerScreen = ({ navigation }) => {
  const [manualCode, setManualCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const lookupItem = async (qrCode) => {
    setIsLoading(true);
    try {
      const response = await api.items.getByQR(qrCode);
      setScannedItem(response.data);
    } catch (error) {
      Alert.alert(
        "Not Found",
        error.message || "No item found for this QR code.",
      );
      setScannedItem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLookup = () => {
    if (!manualCode.trim()) {
      Alert.alert("Error", "Please enter a QR code.");
      return;
    }
    setHasScanned(true);
    lookupItem(manualCode.trim());
  };

  const handleBorrow = () => {
    if (!scannedItem) return;

    if (scannedItem.status !== "available") {
      Alert.alert(
        "Item Unavailable",
        `This item is currently ${scannedItem.status} and cannot be borrowed.`,
        [{ text: "OK" }],
      );
      return;
    }

    navigation?.navigate?.("Borrowing", {
      itemId: scannedItem.id,
      itemName: scannedItem.name,
    });
  };

  const handleScanResult = useCallback(
    ({ data }) => {
      if (hasScanned || !data) return;
      setHasScanned(true);
      lookupItem(String(data).trim());
    },
    [hasScanned],
  );

  const resetScan = () => {
    setHasScanned(false);
    setScannedItem(null);
  };

  return (
    <View style={styles.container}>
      <Header title="Scan QR Code" onBack={() => navigation?.goBack?.()} />

      <View style={styles.content}>
        {Platform.OS === "web" ? (
          <View style={styles.cameraPlaceholder}>
            <Ionicons
              name="qr-code-outline"
              size={80}
              color={colors.textMuted}
            />
            <Text style={styles.placeholderText}>
              Camera scanning is limited on web.{"\n"}Use manual entry below.
            </Text>
          </View>
        ) : (
          <View style={styles.cameraCard}>
            {!permission ? (
              <View style={styles.cameraPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={64}
                  color={colors.textMuted}
                />
                <Text style={styles.placeholderText}>
                  Checking camera permission...
                </Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.cameraPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={64}
                  color={colors.textMuted}
                />
                <Text style={styles.placeholderText}>
                  Camera access is required to scan QR codes.
                </Text>
                <CustomButton
                  title="Allow Camera"
                  onPress={requestPermission}
                  size="md"
                  fullWidth={false}
                />
              </View>
            ) : (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  onBarcodeScanned={hasScanned ? undefined : handleScanResult}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame} />
                  <Text style={styles.scanHint}>
                    {hasScanned
                      ? "Scan complete"
                      : "Align QR code inside the frame"}
                  </Text>
                  {hasScanned && (
                    <CustomButton
                      title="Scan Again"
                      onPress={resetScan}
                      size="sm"
                      fullWidth={false}
                      variant="outline"
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.manualEntry}>
          <Text style={styles.sectionTitle}>Manual QR Code Entry</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="e.g. QR-TECH-A3F7B2C1"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleManualLookup}
            />
            <CustomButton
              title="Search"
              onPress={handleManualLookup}
              loading={isLoading}
              size="md"
              fullWidth={false}
              style={styles.searchButton}
            />
          </View>
        </View>

        {scannedItem && (
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.success}
              />
              <Text style={styles.itemFound}>Item Found</Text>
            </View>
            <Text style={styles.itemName}>{scannedItem.name}</Text>
            <Text style={styles.itemMeta}>
              {scannedItem.category} | {scannedItem.status} |{" "}
              {scannedItem.location || "No location"}
            </Text>
            {scannedItem.description && (
              <Text style={styles.itemDesc}>{scannedItem.description}</Text>
            )}
            <View style={styles.itemActions}>
              {scannedItem.status === "available" && (
                <CustomButton
                  title="Borrow This Item"
                  onPress={handleBorrow}
                  icon="arrow-redo-outline"
                  size="md"
                />
              )}
              {scannedItem.status !== "available" && (
                <Text style={styles.unavailable}>
                  This item is currently {scannedItem.status}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.md },
  cameraPlaceholder: {
    height: 220,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginBottom: spacing.lg,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
  },
  cameraCard: { marginBottom: spacing.lg },
  cameraContainer: {
    height: 260,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    gap: spacing.sm,
  },
  scanFrame: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.white,
  },
  scanHint: { fontSize: fontSize.sm, color: colors.white },
  manualEntry: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputRow: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  searchButton: { minWidth: 80 },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success + "40",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemFound: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.success,
  },
  itemName: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  itemMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    textTransform: "capitalize",
  },
  itemDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  itemActions: { marginTop: spacing.lg },
  unavailable: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default QRScannerScreen;
