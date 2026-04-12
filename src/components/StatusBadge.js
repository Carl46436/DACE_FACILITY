// ============================================================
// StatusBadge Component
// Colored badge for displaying status, priority, category
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { formatStatus } from '../utils/formatters';

const StatusBadge = ({ value, type = 'status', size = 'md' }) => {
  const colorMap = type === 'priority' ? colors.priority : (type === 'category' ? colors.category : colors.status);
  const bgColor = colorMap[value] || colors.textMuted;

  return (
    <View style={[styles.badge, styles[size], { backgroundColor: bgColor + '1A' }]}>
      <View style={[styles.dot, { backgroundColor: bgColor }]} />
      <Text style={[styles.text, styles[`text_${size}`], { color: bgColor }]}>
        {formatStatus(value)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
  text_sm: {
    fontSize: fontSize.xs,
  },
  text_md: {
    fontSize: fontSize.sm,
  },
  text_lg: {
    fontSize: fontSize.md,
  },
});

export default StatusBadge;
