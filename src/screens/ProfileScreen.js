// ============================================================
// Profile Screen
// User profile display and editing
// ============================================================

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import Header from '../components/Header';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../stores/authStore';
import { formatRole, formatDate, getInitials } from '../utils/formatters';

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile, logout, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');

  const resetForm = () => {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    setDepartment(user?.department || '');
  };

  const handleSave = async () => {
    const result = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      department: department.trim(),
    });

    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully.');
      setIsEditing(false);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      resetForm();
    }
    setIsEditing(!isEditing);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" onBack={() => navigation?.goBack?.()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{getInitials(user?.full_name)}</Text>
          </View>
          <Text style={styles.profileName}>{user?.full_name}</Text>
          <Text style={styles.profileRole}>{formatRole(user?.role)}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={toggleEdit}>
              <Ionicons name={isEditing ? 'close' : 'create-outline'} size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <>
              <InputField label="Full Name" value={fullName} onChangeText={setFullName} icon="person-outline" />
              <InputField label="Phone" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
              <InputField label="Department" value={department} onChangeText={setDepartment} icon="business-outline" />
              <CustomButton title="Save Changes" onPress={handleSave} loading={isLoading} icon="checkmark" />
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{user?.full_name || 'Not set'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={18} color={colors.textMuted} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>{user?.department || 'Not set'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Joined</Text>
                  <Text style={styles.infoValue}>{formatDate(user?.created_at)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: user?.is_active ? colors.successLight : colors.dangerLight }]}>
              <Text style={[styles.statusBadgeText, { color: user?.is_active ? colors.success : colors.danger }]}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Approval</Text>
            <View style={[styles.statusBadge, { backgroundColor: user?.is_approved ? colors.successLight : colors.warningLight }]}>
              <Text style={[styles.statusBadgeText, { color: user?.is_approved ? colors.success : colors.warning }]}>
                {user?.is_approved ? 'Approved' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <CustomButton
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          icon="log-out-outline"
          style={{ marginTop: spacing.md }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  avatarText: { fontSize: fontSize.heading, fontWeight: '700', color: colors.white },
  profileName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  profileRole: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '500', marginTop: 4 },
  profileEmail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  infoText: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  infoValue: { fontSize: fontSize.md, color: colors.text, fontWeight: '500', marginTop: 2 },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statusLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusBadgeText: { fontSize: fontSize.sm, fontWeight: '600' },
});

export default ProfileScreen;
