export const colors = {
  bg: '#F5F1EA',
  surface: '#FFFFFF',
  surfaceMuted: '#EDE7DC',

  ink: '#1F1C19',
  inkMuted: '#8B847A',
  inkSubtle: '#A9A196',

  onDark: '#F7F3EC',
  onDarkMuted: '#A79E92',

  primary: '#8A6A4C',
  primaryPressed: '#6F5339',
  primaryTint: '#EFE6DA',
  onPrimary: '#FFFFFF',

  dark: '#26221E',
  darkPressed: '#15120F',

  hairline: '#E3DBCF',
  ring: '#E8E1D6',

  focus: '#8A6A4C',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

export const MIN_TOUCH_TARGET = 48;

export const fonts = {
  serif: 'PlayfairDisplay_500Medium',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
} as const;

export const type = {
  display: { fontFamily: fonts.serifSemiBold, fontSize: 68, lineHeight: 80 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 38 },
  heading: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28 },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
  },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  amount: { fontFamily: fonts.sansSemiBold, fontSize: 20, lineHeight: 26 },
  badge: { fontFamily: fonts.sansSemiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#3A2E20',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  button: {
    shadowColor: '#3A2E20',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
} as const;
