import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, space, type } from '../theme/tokens';

interface TextFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  label: string;
  placeholder?: string;
  maxLength?: number;
}

export function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  maxLength = 40,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      placeholderTextColor={colors.inkSubtle}
      maxLength={maxLength}
      returnKeyType="done"
      style={[styles.input, focused && styles.inputFocused]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: 'transparent',
    color: colors.ink,
    ...type.body,
  },
  inputFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.focus,
  },
});
