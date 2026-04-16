// ============================================================
// Admin Items Screen
// Create items and manage QR codes for borrowing
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  Image,
  RefreshControl,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "../theme/colors";
import Header from "../components/Header";
import InputField from "../components/InputField";
import CustomButton from "../components/CustomButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { api } from "../services/api";
import { confirmAction } from "../utils/confirm";

const categories = [
  { value: "equipment", label: "Equipment" },
  { value: "furniture", label: "Furniture" },
  { value: "technology", label: "Technology" },
  { value: "book", label: "Book" },
  { value: "tool", label: "Tool" },
  { value: "supply", label: "Supply" },
  { value: "other", label: "Other" },
];

const AdminItemsScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("technology");
  const [serialNumber, setSerialNumber] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);

  const loadItems = useCallback(async (isRefresh = false) => {
    try {
      const response = await api.items.getAll({ page: 1, limit: 50 });
      setItems(response.data?.data || []);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load items.");
    } finally {
      setIsLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const validate = useCallback(() => {
    const nextErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Item name is required.";
    } else if (name.trim().length < 2) {
      nextErrors.name = "Item name must be at least 2 characters.";
    }
    if (!category) nextErrors.category = "Please select a category.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [name, category]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("technology");
    setSerialNumber("");
    setLocation("");
    setErrors({});
    setEditingItemId(null);
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const result = await api.items.create({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        serial_number: serialNumber.trim() || undefined,
        location: location.trim() || undefined,
      });
      Alert.alert("Success", "Item created with a QR code.");
      setItems((current) => [result.data, ...current]);
      resetForm();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItemId(item.id);
    setName(item.name || "");
    setDescription(item.description || "");
    setCategory(item.category || "technology");
    setSerialNumber(item.serial_number || "");
    setLocation(item.location || "");
    setErrors({});
  };

  const handleUpdate = async () => {
    if (!editingItemId) return;
    if (!validate()) return;
    setIsSaving(true);
    try {
      const result = await api.items.update(editingItemId, {
        name: name.trim(),
        description: description.trim() || null,
        category,
        serial_number: serialNumber.trim() || null,
        location: location.trim() || null,
      });
      setItems((current) =>
        current.map((item) =>
          item.id === editingItemId ? { ...item, ...result.data } : item,
        ),
      );
      Alert.alert("Updated", "Item updated successfully.");
      resetForm();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetire = (item) => {
    confirmAction({
      title: "Retire Item",
      message: `Retire "${item.name}"?`,
      confirmText: "Retire",
    }).then(async (confirmed) => {
      if (!confirmed) return;
      try {
        const result = await api.items.retire(item.id);
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, ...result.data } : entry,
          ),
        );
        Alert.alert("Retired", "Item retired successfully.");
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to retire item.");
      }
    });
  };

  const handleCopyQr = async (item) => {
    const message = `${item.name}: ${item.qr_code}`;
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        Alert.alert("Copied", "QR code copied to clipboard.");
        return;
      }
      Alert.alert("QR Code", message);
      return;
    }
    Alert.alert("QR Code", message);
  };

  const handleShareQr = async (item) => {
    const message = `${item.name}: ${item.qr_code}`;
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      if (navigator.share) {
        await navigator.share({ text: message });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        Alert.alert("Copied", "QR code copied to clipboard.");
        return;
      }
      Alert.alert("QR Code", message);
      return;
    }

    await Share.share({ message });
  };

  const handleDownloadQr = async (item) => {
    if (!item.qr_image_url) {
      Alert.alert("Unavailable", "QR image is not available yet.");
      return;
    }
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const link = document.createElement("a");
      link.href = item.qr_image_url;
      link.download = `${item.qr_code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    Alert.alert("QR Image", "Open the QR image URL to save or share it.", [
      { text: "OK", style: "cancel" },
    ]);
  };

  const canSubmit = useMemo(
    () => Boolean(name.trim() && category),
    [name, category],
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading items..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Admin Items"
        subtitle="Create items and QR codes"
        onBack={() => navigation?.goBack?.()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadItems(true);
            }}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {editingItemId ? "Edit Item" : "Create Item"}
          </Text>
          <InputField
            label="Item Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Dell Projector"
            icon="pricetag-outline"
            error={errors.name}
          />
          <InputField
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Short description"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <View
            style={[styles.chipRow, errors.category && styles.chipRowError]}
          >
            {categories.map((cat) => (
              <CustomButton
                key={cat.value}
                title={cat.label}
                size="sm"
                fullWidth={false}
                variant={category === cat.value ? "primary" : "outline"}
                onPress={() => {
                  setCategory(cat.value);
                  if (errors.category) {
                    setErrors((prev) => ({ ...prev, category: undefined }));
                  }
                }}
              />
            ))}
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}

          <InputField
            label="Serial Number (Optional)"
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="e.g. DELL-PRJ-001"
            icon="barcode-outline"
          />
          <InputField
            label="Location (Optional)"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Building A, Room 101"
            icon="location-outline"
          />

          <CustomButton
            title={editingItemId ? "Save Changes" : "Create Item & QR"}
            onPress={editingItemId ? handleUpdate : handleCreate}
            loading={isSaving}
            disabled={!canSubmit}
            icon={editingItemId ? "save-outline" : "qr-code-outline"}
          />
          {editingItemId && (
            <CustomButton
              title="Cancel Edit"
              onPress={resetForm}
              variant="outline"
              size="sm"
            />
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <Text style={styles.countText}>{items.length} total</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No items created yet.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemHeaderRight}>
                  <Text style={styles.itemStatus}>{item.status}</Text>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={styles.qrIcon}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemMeta}>
                {item.category} | {item.location || "No location"}
              </Text>
              {item.serial_number && (
                <Text style={styles.itemMeta}>
                  Serial: {item.serial_number}
                </Text>
              )}
              <View style={styles.qrRow}>
                <Text style={styles.qrLabel}>QR: {item.qr_code}</Text>
                <View style={styles.qrActions}>
                  <TouchableOpacity
                    onPress={() => handleCopyQr(item)}
                    style={styles.qrIcon}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleShareQr(item)}
                    style={styles.qrIcon}
                  >
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {item.qr_image_url && (
                <View style={styles.qrImageWrap}>
                  <Image
                    source={{ uri: item.qr_image_url }}
                    style={styles.qrImage}
                  />
                  <CustomButton
                    title="Download QR"
                    size="sm"
                    variant="outline"
                    fullWidth={false}
                    onPress={() => handleDownloadQr(item)}
                  />
                </View>
              )}
              <View style={styles.retireRow}>
                <CustomButton
                  title="Retire Item"
                  size="sm"
                  variant="danger"
                  fullWidth={false}
                  onPress={() => handleRetire(item)}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipRowError: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  required: { color: colors.danger, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  countText: { fontSize: fontSize.sm, color: colors.textMuted },
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  itemStatus: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  qrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  qrLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontFamily: "monospace",
  },
  qrActions: { flexDirection: "row", gap: spacing.sm },
  qrIcon: { padding: spacing.xs },
  qrImageWrap: {
    marginTop: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  qrImage: { width: 160, height: 160, borderRadius: borderRadius.md },
  retireRow: { marginTop: spacing.sm, alignItems: "flex-start" },
});

export default AdminItemsScreen;
