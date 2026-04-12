// ============================================================
// ReportCard Component
// Card displaying report summary for list views
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import StatusBadge from './StatusBadge';
import { formatRelativeTime, truncateText } from '../utils/formatters';

const ReportCard = ({ report, onPress }) => {
  const categoryIcons = {
    electrical: 'flash',
    plumbing: 'water',
    hvac: 'thermometer',
    structural: 'construct',
    cleaning: 'sparkles',
    furniture: 'bed',
    safety: 'shield-checkmark',
    technology: 'hardware-chip',
    other: 'ellipsis-horizontal-circle',
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: (colors.category[report.category] || colors.textMuted) + '1A' }]}>
          <Ionicons
            name={categoryIcons[report.category] || 'document-text'}
            size={20}
            color={colors.category[report.category] || colors.textMuted}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{report.title}</Text>
          <Text style={styles.location} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {report.location}
          </Text>
        </View>
        <Text style={styles.time}>{formatRelativeTime(report.created_at)}</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {truncateText(report.description, 120)}
      </Text>

      <View style={styles.footer}>
        <StatusBadge value={report.status} type="status" size="sm" />
        <StatusBadge value={report.priority} type="priority" size="sm" />
        {report.reporter && (
          <Text style={styles.reporter}>by {report.reporter.full_name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  location: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reporter: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
});

export default ReportCard;
