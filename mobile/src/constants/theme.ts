export const Colors = {
  light: {
    text: '#0F172A',
    background: '#EEF4FF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DBEAFE',
    tint: '#2563EB',
    icon: '#64748B',
    tabIconDefault: '#64748B',
    tabIconSelected: '#2563EB',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    primaryDark: '#0B1228',
    gradientEnd: '#7C3AED',
    surface: '#FFFFFF',
    success: '#059669',
    danger: '#DC2626',
    warning: '#EA580C',
    blueSoft: '#DBEAFE',
    purpleSoft: '#EDE9FE',
  },

  dark: {
    text: '#F8FAFC',
    background: '#0B1228',
    backgroundElement: '#111B35',
    backgroundSelected: '#172554',
    tint: '#60A5FA',
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#60A5FA',
    textSecondary: '#CBD5E1',
    border: '#26324F',
    primary: '#60A5FA',
    primaryDark: '#0B1228',
    gradientEnd: '#8B5CF6',
    surface: '#111B35',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FB923C',
    blueSoft: '#172554',
    purpleSoft: '#2E1065',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = {
  sans: 'System',
  mono: 'monospace',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
} as const;

export const MaxContentWidth = 900;

export const BottomTabInset = 12;

export const COLORS = {
  primary: Colors.light.primary,
  primaryDark: Colors.light.primaryDark,
  gradientEnd: Colors.light.gradientEnd,
  background: Colors.light.background,
  surface: Colors.light.surface,
  text: Colors.light.text,
  secondary: Colors.light.textSecondary,
  success: Colors.light.success,
  danger: Colors.light.danger,
  warning: Colors.light.warning,
  border: Colors.light.border,
  blueSoft: Colors.light.blueSoft,
  purpleSoft: Colors.light.purpleSoft,
};

export const SHADOW = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.1,
  shadowRadius: 18,
  shadowOffset: {
    width: 0,
    height: 8,
  },
  elevation: 6,
};