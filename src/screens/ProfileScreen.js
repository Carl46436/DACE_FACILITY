// ============================================================
// Profile Screen
// User profile display and editing
// ============================================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoImagePicker from "expo-image-picker";
import { colors, spacing, borderRadius, fontSize } from "../theme/colors";
import Header from "../components/Header";
import InputField from "../components/InputField";
import CustomButton from "../components/CustomButton";
import { useAuth } from "../stores/authStore";
import { formatRole, formatDate, getInitials } from "../utils/formatters";
import { supabase } from "../services/supabase";

const base64ToArrayBuffer = (base64) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  while (cleanBase64.length % 4 !== 0) {
    cleanBase64 += "=";
  }

  const bytes = [];
  for (let i = 0; i < cleanBase64.length; i += 4) {
    const enc1 = chars.indexOf(cleanBase64[i]);
    const enc2 = chars.indexOf(cleanBase64[i + 1]);
    const enc3 =
      cleanBase64[i + 2] === "=" ? 64 : chars.indexOf(cleanBase64[i + 2]);
    const enc4 =
      cleanBase64[i + 3] === "=" ? 64 : chars.indexOf(cleanBase64[i + 3]);

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(chr1);
    if (enc3 !== 64) bytes.push(chr2);
    if (enc4 !== 64) bytes.push(chr3);
  }

  return new Uint8Array(bytes).buffer;
};

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile, logout, isLoading, ensureSupabaseSession } =
    useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState(
    user?.avatar_url || "",
  );

  useEffect(() => {
    setFullName(user?.full_name || "");
    setPhone(user?.phone || "");
    setDepartment(user?.department || "");
  }, [user?.full_name, user?.phone, user?.department]);

  useEffect(() => {
    let isMounted = true;

    const resolveAvatar = async () => {
      const avatarUrl = user?.avatar_url;
      if (!avatarUrl) {
        if (isMounted) setAvatarDisplayUrl("");
        return;
      }

      if (avatarUrl.startsWith("http")) {
        if (isMounted) setAvatarDisplayUrl(avatarUrl);
        return;
      }

      try {
        await ensureSupabaseSession();
        const { data, error } = await supabase.storage
          .from("profile_photos")
          .createSignedUrl(avatarUrl, 60 * 60);
        if (error || !data?.signedUrl) {
          if (isMounted) setAvatarDisplayUrl("");
          return;
        }
        if (isMounted) setAvatarDisplayUrl(data.signedUrl);
      } catch {
        if (isMounted) setAvatarDisplayUrl("");
      }
    };

    resolveAvatar();
    return () => {
      isMounted = false;
    };
  }, [ensureSupabaseSession, user?.avatar_url]);

  const resetForm = () => {
    setFullName(user?.full_name || "");
    setPhone(user?.phone || "");
    setDepartment(user?.department || "");
  };

  const handleSave = async () => {
    const result = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      department: department.trim(),
    });

    if (result.success) {
      if (Platform.OS === "web") {
        window.alert("Profile updated successfully.");
      } else {
        Alert.alert("Success", "Profile updated successfully.");
      }
      setIsEditing(false);
      return;
    }

    const rawError = result.error || "Could not update profile.";
    const message = rawError.toLowerCase().includes("schema")
      ? `Profile update failed due to schema mismatch.\n\nRaw error: ${rawError}\n\nRun database/profile_photo_fix.sql in Supabase SQL Editor, then sign out/sign in.`
      : rawError;
    if (Platform.OS === "web") {
      window.alert(`Update failed: ${message}`);
    } else {
      Alert.alert("Update failed", message);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      resetForm();
    }
    setIsEditing((prev) => !prev);
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        logout();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout },
      ]);
    }
  };

  const uploadProfilePhoto = async () => {
    try {
      const { status } =
        await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        const message = "Gallery access is required to upload a profile photo.";
        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          Alert.alert("Permission needed", message);
        }
        return;
      }

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedAsset = result.assets[0];
      // On web, the image data may be available via uri instead of base64
      let imageData = selectedAsset.base64;
      let mimeType = selectedAsset.mimeType || "image/jpeg";

      if (!imageData && selectedAsset.uri) {
        // For web, fetch the image and convert to base64
        if (Platform.OS === "web") {
          if (selectedAsset.uri.startsWith("data:")) {
            // Extract base64 from data URI
            const base64Match = selectedAsset.uri.match(/base64,(.+)/);
            if (base64Match) {
              imageData = base64Match[1];
              // Extract mime type from data URI
              const mimeMatch = selectedAsset.uri.match(/data:([^;]+);/);
              if (mimeMatch) {
                mimeType = mimeMatch[1];
              }
            }
          } else {
            // Fetch the image and convert to base64
            try {
              const response = await fetch(selectedAsset.uri);
              const blob = await response.blob();
              mimeType = blob.type || mimeType;

              // Convert blob to base64
              const reader = new FileReader();
              imageData = await new Promise((resolve, reject) => {
                reader.onloadend = () => {
                  const base64String = reader.result.split(",")[1];
                  resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (fetchError) {
              throw new Error(
                "Could not fetch image data: " + fetchError.message,
              );
            }
          }
        }
      }

      if (!imageData) {
        throw new Error("Could not read selected image data.");
      }

      setIsUploadingPhoto(true);
      await ensureSupabaseSession();

      const extension =
        (selectedAsset.fileName || "avatar.jpg").split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}-avatar.${extension}`;

      // Convert base64 to Blob for upload (works on both web and native)
      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const { error: uploadError } = await supabase.storage
        .from("profile_photos")
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          `Storage upload failed: ${uploadError.message || "unknown storage error"}`,
        );
      }

      const updateResult = await updateProfile({ avatar_url: filePath });
      if (!updateResult.success) {
        throw new Error(
          `Profile update failed: ${updateResult.error || "unknown update error"}`,
        );
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from("profile_photos")
        .createSignedUrl(filePath, 60 * 60);

      if (!signedError && signedData?.signedUrl) {
        setAvatarDisplayUrl(signedData.signedUrl);
      }

      if (Platform.OS === "web") {
        window.alert("Profile photo updated successfully.");
      } else {
        Alert.alert("Success", "Profile photo updated.");
      }
    } catch (error) {
      const rawError = error.message || "Could not upload profile photo.";
      const message = rawError.toLowerCase().includes("schema")
        ? `Schema mismatch detected.\n\nRaw error: ${rawError}\n\nRun database/profile_photo_fix.sql in Supabase SQL Editor, then sign out/sign in.`
        : rawError;
      if (Platform.OS === "web") {
        window.alert(`Upload failed: ${message}`);
      } else {
        Alert.alert("Upload failed", message);
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" onBack={() => navigation?.goBack?.()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            {avatarDisplayUrl ? (
              <Image
                source={{ uri: avatarDisplayUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {getInitials(user?.full_name)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={uploadProfilePhoto}
            disabled={isUploadingPhoto}
            activeOpacity={0.8}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="image-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.photoButtonText}>Change Photo</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{user?.full_name}</Text>
          <Text style={styles.profileRole}>{formatRole(user?.role)}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={toggleEdit}>
              <Ionicons
                name={isEditing ? "close" : "create-outline"}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <>
              <InputField
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                icon="person-outline"
              />
              <InputField
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                icon="call-outline"
                keyboardType="phone-pad"
              />
              <InputField
                label="Department"
                value={department}
                onChangeText={setDepartment}
                icon="business-outline"
              />
              <CustomButton
                title="Save Changes"
                onPress={handleSave}
                loading={isLoading}
                icon="checkmark"
              />
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>
                    {user?.full_name || "Not set"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>
                    {user?.phone || "Not set"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>
                    {user?.department || "Not set"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Joined</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(user?.created_at)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: user?.is_active
                    ? colors.successLight
                    : colors.dangerLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: user?.is_active ? colors.success : colors.danger },
                ]}
              >
                {user?.is_active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Approval</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: user?.is_approved
                    ? colors.successLight
                    : colors.warningLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: user?.is_approved ? colors.success : colors.warning,
                  },
                ]}
              >
                {user?.is_approved ? "Approved" : "Pending"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Actions</Text>
          <CustomButton
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            icon="log-out-outline"
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  avatarSection: { alignItems: "center", paddingVertical: spacing.xl },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: {
    fontSize: fontSize.heading,
    fontWeight: "700",
    color: colors.white,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  photoButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  profileName: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  profileRole: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "500",
    marginTop: 4,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "500",
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  statusLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: { fontSize: fontSize.sm, fontWeight: "600" },
});

export default ProfileScreen;
