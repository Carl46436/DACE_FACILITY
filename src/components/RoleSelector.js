// ============================================================
// RoleSelector Component
// Picker for selecting user roles during registration
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

const roles = [
  { value: 'student', label: 'Student', icon: 'school', description: 'Submit reports & borrow items' },
  { value: 'teacher', label: 'Teacher', icon: 'person', description: 'Submit reports & borrow items' },
  { value: 'maintenance_staff', label: 'Maintenance Staff', icon: 'construct', description: 'Handle assigned reports' },
];

const RoleSelector = ({ selectedRole, onSelectRole, error }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select your role</Text>
      {roles.map((role) => (
        <TouchableOpacity
          key={role.value}
          style={[
            styles.roleCard,
            selectedRole === role.value && styles.selectedCard,
          ]}
          onPress={() => onSelectRole(role.value)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.iconContainer,
            selectedRole === role.value && styles.selectedIcon,
          ]}>
            <Ionicons
              name={role.icon}
              size={22}
              color={selectedRole === role.value ? colors.white : colors.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.roleName, selectedRole === role.value && styles.selectedText]}>
              {role.label}
            </Text>
            <Text style={styles.roleDescription}>{role.description}</Text>
          </View>
          {selectedRole === role.value && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFaded,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  selectedIcon: {
    backgroundColor: colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  roleName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  selectedText: {
    color: colors.primary,
  },
  roleDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});

export default RoleSelector;
