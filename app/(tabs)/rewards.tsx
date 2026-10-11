import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Dialog, FAB, HelperText, Portal, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';

import { RewardSuggestion } from '@/src/ai/AIProvider';
import { Tier } from '@/src/ai/personas';
import { ruleBasedProvider } from '@/src/ai/RuleBasedProvider';
import { Reward, archiveReward, getRewards, saveReward } from '@/src/database/habits';
import { getBalance, redeem } from '@/src/database/ledger';
import { loadVibe } from '@/src/vibe';

const TIER_LABEL: Record<Tier, string> = {
  small: 'Quick treats',
  medium: 'Mid-size rewards',
  big: 'Big splurges',
};

const TIER_HINT: Record<Tier, string> = {
  small: 'A quick treat: price it around a day or two of points.',
  medium: 'A mid-size reward: price it around a week of points.',
  big: 'A big splurge: price it around a few weeks of points.',
};

export default function RewardsScreen() {
  const theme = useTheme();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [balance, setBalance] = useState(0);
  const [suggestions, setSuggestions] = useState<RewardSuggestion[]>([]);
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState<{ id?: number; name: string; cost: string; tier?: Tier } | null>(null);

  const reload = useCallback(() => {
    setRewards(getRewards());
    setBalance(getBalance());
    const existing = new Set(getRewards().map((r) => r.name.toLowerCase()));
    setSuggestions(ruleBasedProvider.suggestRewards(loadVibe()).filter((s) => !existing.has(s.name.toLowerCase())));
  }, []);

  useFocusEffect(reload);

  const onRedeem = (r: Reward) => {
    const res = redeem(r.id);
    setToast(res.ok ? ruleBasedProvider.message('redeem', loadVibe(), { name: r.name }) : res.error);
    reload();
  };

  const costNum = parseInt(editing?.cost ?? '', 10);
  const canSave = !!editing && editing.name.trim().length > 0 && Number.isInteger(costNum) && costNum > 0;

  const onSave = () => {
    if (!editing || !canSave) return;
    saveReward({ id: editing.id, name: editing.name.trim(), cost: costNum });
    setEditing(null);
    reload();
  };

  const onDelete = () => {
    if (editing?.id) archiveReward(editing.id);
    setEditing(null);
    reload();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleMedium" style={styles.balance}>
        Balance: {balance} pts
      </Text>

      {suggestions.length > 0 && (
        <View style={styles.suggest}>
          <Text variant="labelLarge">Picked for you</Text>
          {(['small', 'medium', 'big'] as Tier[]).map((tier) => {
            const items = suggestions.filter((s) => s.tier === tier || (s.favorite && tier === 'medium')).slice(0, 4);
            const unique = items.filter((s, i) => items.findIndex((o) => o.name === s.name) === i);
            if (unique.length === 0) return null;
            return (
              <View key={tier} style={styles.tierBlock}>
                <Text variant="bodySmall" style={styles.tierLabel}>
                  {TIER_LABEL[tier]}
                </Text>
                <View style={styles.chips}>
                  {unique.map((s) => (
                    <Chip
                      key={s.name}
                      icon={s.favorite ? 'heart' : 'lightbulb-outline'}
                      onPress={() => setEditing({ name: s.name, cost: '', tier })}>
                      {s.name}
                    </Chip>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <FlatList
        data={rewards}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No rewards yet. Tap a suggestion or +.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title
              title={item.name}
              subtitle={`${item.cost} pts`}
              right={() => (
                <Button mode="contained" disabled={balance < item.cost} onPress={() => onRedeem(item)} style={styles.action}>
                  Redeem
                </Button>
              )}
            />
            <Card.Actions>
              <Button onPress={() => setEditing({ id: item.id, name: item.name, cost: String(item.cost) })}>Edit</Button>
            </Card.Actions>
          </Card>
        )}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setEditing({ name: '', cost: '' })} />

      <Portal>
        <Dialog visible={!!editing} onDismiss={() => setEditing(null)}>
          <Dialog.Title>{editing?.id ? 'Edit reward' : 'New reward'}</Dialog.Title>
          <Dialog.Content style={styles.dialog}>
            <TextInput
              mode="outlined"
              label="Reward"
              value={editing?.name ?? ''}
              onChangeText={(name) => setEditing((e) => (e ? { ...e, name } : e))}
            />
            <TextInput
              mode="outlined"
              label="Cost (points)"
              keyboardType="number-pad"
              value={editing?.cost ?? ''}
              onChangeText={(cost) => setEditing((e) => (e ? { ...e, cost } : e))}
            />
            {editing?.tier ? (
              <HelperText type="info">{TIER_HINT[editing.tier]}</HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            {editing?.id ? <Button onPress={onDelete}>Delete</Button> : null}
            <Button onPress={() => setEditing(null)}>Cancel</Button>
            <Button disabled={!canSave} onPress={onSave}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={2500}>
        {toast}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  balance: { marginBottom: 8 },
  suggest: { marginBottom: 12, gap: 6 },
  tierBlock: { gap: 4 },
  tierLabel: { opacity: 0.7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { paddingBottom: 96 },
  card: { marginBottom: 10 },
  action: { marginRight: 12 },
  empty: { textAlign: 'center', marginTop: 32, opacity: 0.6 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  dialog: { gap: 12 },
});
