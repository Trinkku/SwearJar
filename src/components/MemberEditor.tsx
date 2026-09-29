import { Pressable, StyleSheet, View } from 'react-native';

import { createId } from '../domain/id';
import { MAX_MEMBERS, type Member } from '../domain/types';
import { MIN_TOUCH_TARGET, colors, radius, space } from '../theme/tokens';
import { AppText } from './AppText';
import { TextField } from './TextField';

interface MemberEditorProps {
  members: Member[];
  onChange: (members: Member[]) => void;
}

export function MemberEditor({ members, onChange }: MemberEditorProps) {
  const rename = (id: string, name: string) =>
    onChange(members.map((member) => (member.id === id ? { ...member, name } : member)));

  const remove = (id: string) => onChange(members.filter((member) => member.id !== id));

  const add = () =>
    onChange([...members, { id: createId(), name: `Henkilö ${members.length + 1}` }]);

  const canRemove = members.length > 1;

  return (
    <View style={styles.root}>
      {members.map((member, index) => (
        <View key={member.id} style={styles.row}>
          <View style={styles.field}>
            <TextField
              label={`Nimi: henkilö ${index + 1}`}
              value={member.name}
              placeholder={`Henkilö ${index + 1}`}
              onChangeText={(name) => rename(member.id, name)}
              maxLength={20}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Poista ${member.name}`}
            accessibilityState={{ disabled: !canRemove }}
            disabled={!canRemove}
            onPress={() => remove(member.id)}
            style={({ pressed }) => [
              styles.remove,
              pressed && canRemove && styles.removePressed,
              !canRemove && styles.removeDisabled,
            ]}
          >
            <AppText variant="button" tone={canRemove ? 'muted' : 'subtle'}>
              −
            </AppText>
          </Pressable>
        </View>
      ))}

      {members.length < MAX_MEMBERS ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lisää henkilö"
          onPress={add}
          style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
        >
          <AppText variant="label" tone="primary">
            + Lisää henkilö
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  field: {
    flex: 1,
  },
  remove: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePressed: {
    backgroundColor: colors.surfaceMuted,
  },
  removeDisabled: {
    opacity: 0.35,
  },
  add: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
  },
  addPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});
