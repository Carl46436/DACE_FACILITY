// ============================================================
// NotificationItem Component
// Individual notification row for the notification list
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { formatRelativeTime } from '../utils/formatters';

const notificationIcons = {
  report_update: 'document-text',
  borrow_request: 'arrow-redo',
  borrow_approved: 'checkmark-circle',
  borrow_overdue: 'time',
  system: 'information-circle',
  admin_approval: 'person-add',
};

const notificationColors = {
  report_update: colors.info,
  borrow_request: colors.secondary,
  borrow_approved: colors.success,
  borrow_overdue: colors.danger,
  system: colors.textSecondary,
  admin_approval: colors.primary,
};

const NotificationItem = ({ notification, onPress }) => {
  const icon = notificationIcons[notification.type] || 'notifications';
  const color = notificationColors[notification.type] || colors.textMuted;

  return (
    <TouchableOpacity
      style={[styles.container, !notification.is_read && styles.unread]}
      onPress={() => onPress?.(notification)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !notification.is_read && styles.unreadText]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>{formatRelativeTime(notification.created_at)}</Text>
      </View>
      {!notification.is_read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  unread: {
    backgroundColor: colors.primaryFaded,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  unreadText: {
    fontWeight: '700',
  },
  message: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});

export default NotificationItem;
