// ============================================================
// Confirm helper
// Web fallback for Alert.confirm dialogs
// ============================================================

import { Alert, Platform } from 'react-native';

export const confirmAction = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, onPress: () => resolve(true) },
    ]);
  });
};

export default confirmAction;
