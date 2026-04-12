// ============================================================
// Theme Colors
// Central color palette for the DACE Facility App
// ============================================================

export const colors = {
  // Primary brand colors
  primary: '#1B6B93',
  primaryLight: '#4A9CC7',
  primaryDark: '#0F4D6B',
  primaryFaded: 'rgba(27, 107, 147, 0.1)',

  // Secondary / accent
  secondary: '#F59E0B',
  secondaryLight: '#FCD34D',
  secondaryDark: '#D97706',

  // Status colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutral palette
  white: '#FFFFFF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  surface: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text colors
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Priority colors
  priority: {
    low: '#10B981',
    medium: '#3B82F6',
    high: '#F59E0B',
    critical: '#EF4444',
  },

  // Status badge colors
  status: {
    submitted: '#3B82F6',
    under_review: '#8B5CF6',
    assigned: '#F59E0B',
    in_progress: '#F97316',
    resolved: '#10B981',
    closed: '#6B7280',
    rejected: '#EF4444',
    pending: '#F59E0B',
    approved: '#10B981',
    active: '#3B82F6',
    returned: '#6B7280',
    overdue: '#EF4444',
    lost: '#DC2626',
    cancelled: '#9CA3AF',
    available: '#10B981',
    borrowed: '#F59E0B',
    maintenance: '#F97316',
    retired: '#6B7280',
  },

  // Category colors
  category: {
    electrical: '#F59E0B',
    plumbing: '#3B82F6',
    hvac: '#8B5CF6',
    structural: '#F97316',
    cleaning: '#10B981',
    furniture: '#EC4899',
    safety: '#EF4444',
    technology: '#6366F1',
    other: '#6B7280',
    equipment: '#F59E0B',
    book: '#8B5CF6',
    tool: '#14B8A6',
    supply: '#F97316',
  },

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.16)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  heading: 28,
  hero: 34,
};

export default { colors, spacing, borderRadius, fontSize };
