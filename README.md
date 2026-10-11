# Habit Rewards

An Android habit tracker that turns good actions into points, and points into rewards **you** choose (pizza, a movie, a trip). Built with React Native + Expo. All data stays on your phone.

## Why
Habit apps log completions but the reward is generic. Habit Rewards makes the reward personal: you define what the points buy, and the app shapes suggestions and messages around the kind of person you are.

## Features (V1)
- **Habits:** create, edit and delete habits with a points value and optional daily reminder.
- **Plain-language input:** type "read a page every night worth 10 points" and the habit form is prefilled (never created silently).
- **Check-ins:** tap to complete today's habit, tap again to undo (same day only).
- **Points ledger:** points only move through an append-only history. There is no way to edit the balance.
- **Rewards:** set your own rewards and costs; redeeming is blocked if you can't afford it.
- **Gamification:** level and XP, overall day streak, per-habit streaks with milestone badges (3/7/14/30/60/100 days), 8 achievements, and celebration messages.
- **Personalization:** pick the types that fit you (gym, sports, gamer, foodie...) and write a line about yourself. Reward suggestions (quick treats, mid-size, big splurges) and messages follow your profile.
- **Insights:** weekly chart, 4-week heatmap, per-habit stats, next-reward progress, full history.
- **Reminders:** daily local notifications per habit.

## Tech stack
Expo SDK 54, React Native 0.81, React 19, expo-router (file-based navigation), react-native-paper (UI), expo-sqlite (storage), expo-notifications, TypeScript (strict).

## Run it
```bash
npm install
npm start        # scan the QR code with Expo Go on your Android phone
npm run typecheck
npm test         # ledger, personalization and gamification checks (no device needed)
```

**Reminders and Expo Go:** Expo Go (SDK 53+) no longer supports remote push, and local reminders are best-effort there. For reliable reminders use a development build.

## Project structure
```
app/                     screens (expo-router)
  (tabs)/index.tsx       Home: level, streak, today's habits, achievements, insights
  (tabs)/rewards.tsx     rewards, suggestions, redeem
  (tabs)/settings.tsx    "About you" profile, reminders
  habit/[id].tsx         create / edit habit
  onboarding.tsx         first-run profile
components/              VibeForm, Insights
src/
  database/              SQLite schema, ledger rules, habit/reward CRUD
  ai/                    AIProvider interface, rule-based provider, personas
  gamification.ts        levels, milestones, achievements
  dashboard.ts           data loader for Home
  notifications.ts       local reminders
tests/                   logic tests run against in-memory SQLite
```

## How the rules work
- Balance = sum of the ledger. Entries are never edited or deleted.
- Check-in is today only, once per habit per day.
- Undo is same-day and adds a reversing entry. It is blocked if those points were already spent.
- XP is total points ever earned, so spending never lowers your level.
- Badges, once unlocked, stay unlocked.

Limit: data is local, so a determined user could tamper with their own device. The design is about honesty and deterrence, not security.

## AI today vs. later
V1 uses a rule-based provider (keyword parsing and templates) behind an `AIProvider` interface (`src/ai/AIProvider.ts`). A real model can replace it without changing any screen.

## Future enhancements
**Next (V2)**
- **Dynamic AI rewards:** log what you actually did in your own words; the AI judges effort, awards a variable bonus within app-enforced limits, and picks or writes a reward that fits you.
- **On-device AI:** a small local model (needs a development build) for parsing, reward suggestions and messages with no network.
- **Usage-based verification (Android):** check app usage (e.g. Kindle, Duolingo) to confirm a habit was really done.
- **AI-suggested reward costs** based on points earned per week.
- **Streak bonus points** at milestones (needs a new ledger entry type).

**Later**
- Count-based habits (pages read, minutes), flexible schedules.
- Adaptive personalization that learns from your history.
- Cloud backup, export, and multi-device sync with accounts.
- Remote push notifications and home-screen widgets.
- Accountability buddies and shared goals.
- iOS support.
