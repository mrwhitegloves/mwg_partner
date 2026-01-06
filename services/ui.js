import responsive from './responsive';

export const spacing = {
  xs: responsive.padding(4),
  sm: responsive.padding(8),
  md: responsive.padding(12),
  lg: responsive.padding(16),
  xl: responsive.padding(20),
  xxl: responsive.padding(24),
};

export const radius = {
  sm: responsive.radius(8),
  md: responsive.radius(12),
  lg: responsive.radius(16),
  xl: responsive.radius(20),
  pill: responsive.radius(999),
};

export const font = {
  xs: responsive.font(11),
  sm: responsive.font(13),
  md: responsive.font(15),
  lg: responsive.font(17),
  xl: responsive.font(20),
  xxl: responsive.font(24),
};

export const icon = {
  sm: responsive.font(16),
  md: responsive.font(20),
  lg: responsive.font(24),
  xl: responsive.font(32),
};

export const colors = {
  primary: '#cc2e2e',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1A202C',
  muted: '#64748B',
  border: '#E2E8F0',
};
