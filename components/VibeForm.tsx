import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';

import { Vibe } from '@/src/ai/AIProvider';
import { PERSONAS, resolvePersonas } from '@/src/ai/personas';
import { splitList } from '@/src/vibe';

type Props = {
  initial: Vibe;
  submitLabel: string;
  onSubmit: (vibe: Vibe) => void;
};

export function VibeForm({ initial, submitLabel, onSubmit }: Props) {
  const [personas, setPersonas] = useState<string[]>(initial.personas);
  const [about, setAbout] = useState(initial.about);
  const [favorites, setFavorites] = useState(initial.favorites.join(', '));

  const toggle = (id: string) =>
    setPersonas((cur) => (cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]));

  // Personas the app picked up from the free text, so the user can see what it understood.
  const detected = resolvePersonas([], about).filter((p) => !personas.includes(p.id));

  return (
    <View style={styles.container}>
      <Text variant="titleSmall">What are you into? Pick any that fit.</Text>
      <View style={styles.chips}>
        {PERSONAS.map((p) => (
          <Chip key={p.id} icon={p.icon} selected={personas.includes(p.id)} showSelectedCheck onPress={() => toggle(p.id)}>
            {p.label}
          </Chip>
        ))}
      </View>

      <TextInput
        mode="outlined"
        label="Tell us more about you (optional)"
        placeholder="I lift 4x a week, play cricket on weekends and love anime"
        value={about}
        onChangeText={setAbout}
        multiline
      />
      {detected.length > 0 && (
        <Text variant="bodySmall" style={styles.muted}>
          Also picked up from your text: {detected.map((p) => p.label).join(', ')}
        </Text>
      )}

      <TextInput
        mode="outlined"
        label="Rewards you already love (comma separated)"
        placeholder="Order pizza, Sunday movie, new sneakers"
        value={favorites}
        onChangeText={setFavorites}
      />

      <Button mode="contained" onPress={() => onSubmit({ personas, about, favorites: splitList(favorites) })}>
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muted: { opacity: 0.7 },
});
