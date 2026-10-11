import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, IconButton, ProgressBar, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';

import { Insights } from '@/components/Insights';
import { ruleBasedProvider } from '@/src/ai/RuleBasedProvider';
import { Data, HabitStat, loadData } from '@/src/dashboard';
import { checkIn, undo } from '@/src/database/ledger';
import { isMilestone, motivation } from '@/src/gamification';
import { loadVibe } from '@/src/vibe';

const FLAME = '#FF7A00';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [quick, setQuick] = useState('');
  const [toast, setToast] = useState('');

  /** Reloads everything; `extra` are celebration lines to show alongside any newly unlocked badges. */
  const refresh = useCallback((extra: string[] = []) => {
    const next = loadData();
    const lines = [...extra];
    if (next.newAchievements.length > 0) {
      lines.push(`🏆 Unlocked: ${next.newAchievements.map((a) => a.label).join(', ')}`);
    }
    if (lines.length > 0) setToast(lines.join('\n'));
    setData(next);
    return next;
  }, []);

  useFocusEffect(useCallback(() => void refresh(), [refresh]));

  if (!data) return null;

  const onCheckIn = (h: HabitStat) => {
    const levelBefore = data.level.level;
    const res = checkIn(h.id);
    if (!res.ok) return setToast(res.error);

    const vibe = loadVibe();
    const lines = [ruleBasedProvider.message('checkin', vibe, { points: h.points })];
    const next = loadData(); // streaks and level after this check-in
    const updated = next.habits.find((x) => x.id === h.id);
    if (updated) {
      if (isMilestone(updated.streak)) lines.push(`🏅 ${updated.streak}-day streak on ${h.name}!`);
      else if (updated.streak >= 2) lines.push(`🔥 ${updated.streak} days in a row`);
    }
    if (next.level.level > levelBefore) lines.push(`⬆️ Level up! You're now a ${next.level.title}.`);
    if (next.habitCount > 0 && next.doneToday >= next.habitCount) lines.push('🎉 Perfect day!');
    refresh(lines);
  };

  const onUndoHabit = (h: HabitStat) => {
    if (h.entryId === null) return;
    const res = undo(h.entryId);
    refresh([res.ok ? 'Undone.' : res.error]);
  };

  const onQuickAdd = () => {
    if (!quick.trim()) return;
    const parsed = ruleBasedProvider.parseHabit(quick);
    router.push({
      pathname: '/habit/[id]',
      params: {
        id: 'new',
        name: parsed.name,
        points: parsed.points !== null ? String(parsed.points) : '',
        time: parsed.reminderTime ?? '',
      },
    });
    setQuick('');
  };

  const { level, activityStreak, bestActivityStreak, habitCount, doneToday } = data;
  const streakAlive = activityStreak > 0;
  const atRisk = streakAlive && doneToday === 0;
  const earnedBadges = data.achievements.filter((a) => a.unlocked).length;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Hero: level, XP, balance, streak */}
        <Card style={{ backgroundColor: theme.colors.primaryContainer }}>
          <Card.Content style={styles.heroContent}>
            <View style={styles.heroTop}>
              <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                  LVL
                </Text>
                <Text variant="headlineSmall" style={{ color: theme.colors.onPrimary }}>
                  {level.level}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                  {level.title}
                </Text>
                <ProgressBar progress={level.progress} style={styles.xpBar} />
                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  {level.xpIntoLevel}/{level.xpNeeded} XP to level {level.level + 1}
                </Text>
              </View>
              <View style={styles.balance}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  {data.balance}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  points
                </Text>
              </View>
            </View>

            <View style={[styles.streakStrip, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons name="fire" size={44} color={streakAlive ? FLAME : theme.colors.outline} />
              <View style={styles.flex}>
                <Text variant="headlineSmall">
                  {activityStreak} day{activityStreak === 1 ? '' : 's'} streak
                </Text>
                <Text variant="bodySmall" style={atRisk ? { color: FLAME } : styles.muted}>
                  {motivation({ habitCount, doneToday, activityStreak })}
                </Text>
              </View>
              <View style={styles.best}>
                <MaterialCommunityIcons name="trophy-outline" size={18} color={theme.colors.primary} />
                <Text variant="labelSmall">Best {bestActivityStreak}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Add habit */}
        <TextInput
          mode="outlined"
          label="Add a habit in your own words"
          placeholder="read a page every night worth 10 points"
          value={quick}
          onChangeText={setQuick}
          onSubmitEditing={onQuickAdd}
          left={<TextInput.Icon icon="plus-circle-outline" />}
          right={<TextInput.Icon icon="arrow-right" onPress={onQuickAdd} />}
        />

        {/* Today's habits */}
        <View style={styles.sectionHead}>
          <Text variant="titleMedium">Today</Text>
          <Text variant="labelLarge" style={styles.muted}>
            {doneToday}/{habitCount} done
          </Text>
        </View>
        {habitCount === 0 ? (
          <Card>
            <Card.Content style={styles.emptyCard}>
              <MaterialCommunityIcons name="rocket-launch-outline" size={36} color={theme.colors.primary} />
              <Text variant="titleSmall">No habits yet</Text>
              <Text style={styles.muted}>Type one above, like “meditate every morning worth 5 points”.</Text>
            </Card.Content>
          </Card>
        ) : null}
        {data.habits.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            onToggle={() => (h.entryId === null ? onCheckIn(h) : onUndoHabit(h))}
            onEdit={() => router.push({ pathname: '/habit/[id]', params: { id: String(h.id) } })}
          />
        ))}

        {/* Achievements */}
        <View style={styles.sectionHead}>
          <Text variant="titleMedium">Achievements</Text>
          <Text variant="labelLarge" style={styles.muted}>
            {earnedBadges}/{data.achievements.length}
          </Text>
        </View>
        <View style={styles.badges}>
          {data.achievements.map((a) => (
            <View key={a.id} style={styles.badge}>
              <View
                style={[
                  styles.badgeIcon,
                  { backgroundColor: a.unlocked ? theme.colors.tertiaryContainer : theme.colors.surfaceVariant },
                  !a.unlocked && styles.locked,
                ]}>
                <MaterialCommunityIcons
                  name={a.unlocked ? a.icon : 'lock-outline'}
                  size={26}
                  color={a.unlocked ? theme.colors.onTertiaryContainer : theme.colors.outline}
                />
              </View>
              <Text variant="labelSmall" style={styles.badgeLabel} numberOfLines={2}>
                {a.unlocked ? a.label : a.hint}
              </Text>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.sectionHead}>
          <Text variant="titleMedium">Insights</Text>
        </View>
        <Insights
          data={data}
          onUndo={(entry) => {
            const res = undo(entry.id);
            refresh([res.ok ? 'Undone.' : res.error]);
          }}
        />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => router.push({ pathname: '/habit/[id]', params: { id: 'new' } })} />
      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={4500}>
        {toast}
      </Snackbar>
    </View>
  );
}

function HabitCard({ habit: h, onToggle, onEdit }: { habit: HabitStat; onToggle: () => void; onEdit: () => void }) {
  const theme = useTheme();
  const done = h.entryId !== null;
  const lastMilestone = h.nextMilestone
    ? [0, 3, 7, 14, 30, 60, 100].filter((m) => m < h.nextMilestone!).pop() ?? 0
    : 0;
  const milestoneProgress = h.nextMilestone ? (h.streak - lastMilestone) / (h.nextMilestone - lastMilestone) : 1;

  return (
    <Card style={done ? { backgroundColor: theme.colors.secondaryContainer } : undefined}>
      <Card.Content style={styles.habitRow}>
        <IconButton
          icon={done ? 'check-circle' : 'circle-outline'}
          size={36}
          iconColor={done ? theme.colors.primary : theme.colors.outline}
          onPress={onToggle}
          accessibilityLabel={done ? `Undo ${h.name}` : `Complete ${h.name}`}
        />
        <View style={styles.flex}>
          <Text variant="titleMedium" style={done ? styles.struck : undefined}>
            {h.name}
          </Text>
          <View style={styles.habitMeta}>
            <Text variant="bodySmall">+{h.points} pts</Text>
            <MaterialCommunityIcons name="fire" size={16} color={h.streak > 0 ? FLAME : theme.colors.outline} />
            <Text variant="bodySmall">{h.streak}d</Text>
            {h.reminderTime ? <Text variant="bodySmall">· ⏰ {h.reminderTime}</Text> : null}
          </View>
          {h.nextMilestone ? (
            <View style={styles.milestone}>
              <ProgressBar progress={milestoneProgress} style={styles.miniBar} />
              <Text variant="labelSmall" style={styles.muted}>
                {h.nextMilestone - h.streak} more day{h.nextMilestone - h.streak === 1 ? '' : 's'} to the {h.nextMilestone}-day badge
              </Text>
            </View>
          ) : (
            <Text variant="labelSmall" style={styles.muted}>
              🏅 Top streak badge reached
            </Text>
          )}
        </View>
        <IconButton icon="pencil-outline" size={20} onPress={onEdit} accessibilityLabel={`Edit ${h.name}`} />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 12, gap: 12, paddingBottom: 96 },
  muted: { opacity: 0.65 },
  heroContent: { gap: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  xpBar: { height: 8, borderRadius: 4, marginVertical: 4 },
  balance: { alignItems: 'center' },
  streakStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16 },
  best: { alignItems: 'center' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  emptyCard: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  habitRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  milestone: { marginTop: 6, gap: 2 },
  miniBar: { height: 5, borderRadius: 3 },
  struck: { textDecorationLine: 'line-through', opacity: 0.6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  badge: { width: '25%', alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  badgeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  locked: { opacity: 0.6 },
  badgeLabel: { textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
