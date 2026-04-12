// ============================================================
// QRCodeDisplay Component
// Displays a QR code identifier with copy and share actions
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

const QRCodeDisplay = ({ qrCode, itemName }) => {
  const handleCopy = async () => {
    const message = `${itemName}: ${qrCode}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        if (navigator.share) {
          await navigator.share({ text: message });
          return;
        }
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(message);
          Alert.alert('Copied', 'QR code copied to clipboard.');
          return;
        }
        Alert.alert('QR Code', message);
        return;
      }

      await Share.share({ message });
    } catch {
      Alert.alert('QR Code', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrPlaceholder}>
        <Ionicons name="qr-code" size={100} color={colors.primary} />
      </View>
      <Text style={styles.itemName}>{itemName}</Text>
      <View style={styles.codeRow}>
        <Text style={styles.codeText}>{qrCode}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyButton} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  copyButton: {
    padding: spacing.xs,
  },
});

export default QRCodeDisplay;
