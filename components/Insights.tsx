import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Divider, ProgressBar, Text, useTheme } from 'react-native-paper';

import { Data } from '@/src/dashboard';
import { LedgerEntry, dayString } from '@/src/database/ledger';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const BAR_HEIGHT = 96;
const HISTORY_PREVIEW = 8;

type Props = { data: Data; onUndo: (entry: LedgerEntry) => void };

export function Insights({ data, onUndo }: Props) {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);
  const { habitCount, days } = data;
  const today = dayString();
  const week = days.slice(-7);
  const weekDone = week.reduce((sum, d) => sum + Math.min(d.count, habitCount), 0);
  const weekRate = habitCount ? Math.round((weekDone / (habitCount * 7)) * 100) : 0;
  const ratio = (count: number) => (habitCount ? Math.min(count / habitCount, 1) : 0);
  const history = showAll ? data.ledger : data.ledger.slice(0, HISTORY_PREVIEW);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Tile icon="chart-line" label="7-day rate" value={`${weekRate}%`} />
        <Tile icon="arrow-up-bold-circle-outline" label="Earned" value={String(data.earned)} />
        <Tile icon="arrow-down-bold-circle-outline" label="Spent" value={String(data.spent)} />
      </View>

      {data.nextReward ? (
        <Card>
          <Card.Content style={styles.gap}>
            <Text variant="titleSmall">
              {data.balance >= data.nextReward.cost ? 'You can claim' : 'Next reward'}: {data.nextReward.name}
            </Text>
            <ProgressBar progress={Math.min(data.balance / data.nextReward.cost, 1)} style={styles.bar} />
            <Text variant="bodySmall" style={styles.muted}>
              {data.balance >= data.nextReward.cost
                ? 'Head to Rewards to redeem it.'
                : `${data.nextReward.cost - data.balance} more points to go (${data.balance}/${data.nextReward.cost})`}
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      <Card>
        <Card.Title title="This week" subtitle="Share of habits completed each day" />
        <Card.Content>
          <View style={styles.chart}>
            {week.map(({ day, count }) => {
              const r = ratio(count);
              const isToday = day === today;
              return (
                <View key={day} style={styles.barCol}>
                  <Text variant="labelSmall" style={styles.muted}>
                    {count}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: Math.max(r * BAR_HEIGHT, r > 0 ? 6 : 0),
                          backgroundColor: isToday ? theme.colors.primary : theme.colors.secondary,
                        },
                      ]}
                    />
                  </View>
                  <Text variant="labelSmall" style={isToday ? { color: theme.colors.primary, fontWeight: 'bold' } : styles.muted}>
                    {WEEKDAYS[new Date(`${day}T00:00:00`).getDay()]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Last 4 weeks" subtitle="Darker means more habits done" />
        <Card.Content>
          <View style={styles.heatmap}>
            {days.map(({ day, count }) => {
              const r = ratio(count);
              return (
                <View
                  key={day}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: r > 0 ? theme.colors.primary : theme.colors.surfaceVariant,
                      opacity: r > 0 ? 0.25 + 0.75 * r : 1,
                      borderColor: day === today ? theme.colors.onSurface : 'transparent',
                    },
                  ]}
                />
              );
            })}
          </View>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Habit stats" />
        <Card.Content style={styles.gap}>
          {data.habits.length === 0 ? <Text style={styles.muted}>No habits yet.</Text> : null}
          {data.habits.map((h) => (
            <View key={h.id} style={styles.gap}>
              <Text variant="titleSmall">{h.name}</Text>
              <View style={styles.dots}>
                {h.week.map(({ day, done }) => (
                  <View
                    key={day}
                    style={[styles.dot, { backgroundColor: done ? theme.colors.primary : theme.colors.surfaceVariant }]}
                  />
                ))}
              </View>
              <Text variant="bodySmall" style={styles.muted}>
                Longest streak {h.longest}d · {h.total} total check-ins
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="History" subtitle="Points only move through here" />
        <Card.Content>
          {history.length === 0 ? <Text style={styles.muted}>Nothing yet.</Text> : null}
          {history.map((e, i) => (
            <View key={e.id}>
              {i > 0 && <Divider style={styles.divider} />}
              <View style={styles.ledgerRow}>
                <View style={styles.flex}>
                  <Text style={e.reversed ? styles.struck : undefined}>{e.label}</Text>
                  <Text variant="bodySmall" style={styles.muted}>
                    {e.day} · {e.type.toLowerCase()}
                  </Text>
                </View>
                <Text style={{ color: e.points >= 0 ? theme.colors.primary : theme.colors.error }}>
                  {e.points > 0 ? '+' : ''}
                  {e.points}
                </Text>
                {e.day === today && e.type !== 'REVERSAL' && !e.reversed ? (
                  <Button compact onPress={() => onUndo(e)}>
                    Undo
                  </Button>
                ) : null}
              </View>
            </View>
          ))}
          {data.ledger.length > HISTORY_PREVIEW ? (
            <Button onPress={() => setShowAll((v) => !v)}>{showAll ? 'Show less' : `Show all (${data.ledger.length})`}</Button>
          ) : null}
        </Card.Content>
      </Card>
    </View>
  );
}

function Tile({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.tile}>
      <Card.Content style={styles.tileContent}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary} />
        <Text variant="titleMedium">{value}</Text>
        <Text variant="labelSmall" style={styles.muted}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  flex: { flex: 1 },
  gap: { gap: 8 },
  muted: { opacity: 0.65 },
  bar: { height: 8, borderRadius: 4 },
  row: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1 },
  tileContent: { alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', gap: 4, flex: 1 },
  barTrack: { width: 22, height: BAR_HEIGHT, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' },
  cell: { width: '12%', aspectRatio: 1, borderRadius: 6, borderWidth: 2 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 20, height: 20, borderRadius: 10 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  divider: { marginVertical: 2 },
  struck: { textDecorationLine: 'line-through', opacity: 0.5 },
});
