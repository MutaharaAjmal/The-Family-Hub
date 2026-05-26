# Bill Scanner — Developer Guide
> Expo + React Native · OpenRouter Vision API · Local Notifications

Scan a bill photo → extract the due date with AI → schedule a reminder. Built for idea validation using free-tier AI models.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Setup](#1-project-setup)
3. [OpenRouter API Key](#2-openrouter-api-key)
4. [App Permissions](#3-app-permissions)
5. [Image Picker Service](#4-image-picker-service)
6. [OpenRouter Vision Service](#5-openrouter-vision-service)
7. [Notification Scheduler](#6-notification-scheduler)
8. [Main Screen UI](#7-main-screen-ui)
9. [Test & Run](#8-test--run)
10. [Upgrade Path](#upgrade-path)

---

## Tech Stack

| Package | Purpose |
|---|---|
| `expo-image-picker` | Camera + gallery access |
| `expo-file-system` | Convert image to base64 |
| `expo-notifications` | Local push notifications |
| `@notifee/react-native` | Advanced notification scheduling |
| `date-fns` | Parse and manipulate dates |
| OpenRouter API | AI vision — free tier available |

**Recommended free vision model:** `qwen/qwen-2-vl-7b-instruct`

---

## 1. Project Setup

Create a fresh Expo project with the TypeScript template:

```bash
npx create-expo-app BillScanner --template blank-typescript
cd BillScanner
```

Install all dependencies at once:

```bash
npx expo install expo-image-picker expo-notifications expo-file-system
npm install @notifee/react-native date-fns
```

---

## 2. OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai) and create a free account
2. Navigate to **Keys** → Create a new API key
3. Copy the key — it starts with `sk-or-v1-...`
4. Create a `.env` file in your project root:

```env
EXPO_PUBLIC_OPENROUTER_KEY=sk-or-v1-your-key-here
```

### Free vision models available on OpenRouter

| Model | Notes |
|---|---|
| `qwen/qwen-2-vl-7b-instruct` | Recommended — excellent OCR |
| `meta-llama/llama-3.2-11b-vision-instruct` | Good fallback |
| `google/gemini-flash-1.5` | Fast, reliable |

---

## 3. App Permissions

Add plugin configuration to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow BillScanner to read your bills",
          "cameraPermission": "Allow BillScanner to take bill photos"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "android": {
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "POST_NOTIFICATIONS"
      ]
    }
  }
}
```

---

## 4. Image Picker Service

Create `src/services/imagePicker.ts`:

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export async function pickBillImage(): Promise<string | null> {
  // Request camera permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission denied');
  }

  // Launch camera
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,   // Good quality, keeps file size manageable
    base64: false,  // We'll convert manually for better control
  });

  if (result.canceled || !result.assets[0]) return null;

  // Convert image to base64
  const uri = result.assets[0].uri;
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return base64;
}
```

> **Tip:** To also support gallery selection, add a second function using `launchImageLibraryAsync` and `requestMediaLibraryPermissionsAsync`.

---

## 5. OpenRouter Vision Service

Create `src/services/extractDate.ts`:

```typescript
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY;
const MODEL   = 'qwen/qwen-2-vl-7b-instruct';

export async function extractDueDateFromBill(
  base64Image: string
): Promise<string | null> {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app.com', // optional but good practice
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: `Look at this bill or invoice image.
Extract the due date or payment date.
Return ONLY the date in YYYY-MM-DD format.
If no due date is found, return the word: null`,
              },
            ],
          },
        ],
        max_tokens: 30,
      }),
    }
  );

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content?.trim();

  // Validate format before returning
  if (!raw || raw === 'null') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;

  return raw;
}
```

---

## 6. Notification Scheduler

Create `src/services/notifications.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { parseISO, subDays, isFuture } from 'date-fns';

// Call this once on app startup
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function scheduleBillReminder(
  dueDateStr: string,
  billName = 'Your bill'
): Promise<void> {
  const dueDate   = parseISO(dueDateStr);
  const dayBefore = subDays(dueDate, 1);

  // Reminder 1 day before (only if still in the future)
  if (isFuture(dayBefore)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bill due tomorrow',
        body: `${billName} is due tomorrow. Don't forget to pay!`,
        data: { dueDate: dueDateStr },
      },
      trigger: {
        date: dayBefore,
      },
    });
  }

  // Reminder on the due date itself
  if (isFuture(dueDate)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bill due today',
        body: `${billName} is due today!`,
        data: { dueDate: dueDateStr },
      },
      trigger: {
        date: dueDate,
      },
    });
  }
}
```

---

## 7. Main Screen UI

Wire all three services together in `App.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import { pickBillImage }          from './src/services/imagePicker';
import { extractDueDateFromBill } from './src/services/extractDate';
import {
  scheduleBillReminder,
  requestNotificationPermission
} from './src/services/notifications';
import { format, parseISO } from 'date-fns';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [status,  setStatus]  = useState('');

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleScanBill = async () => {
    try {
      setLoading(true);
      setStatus('Opening camera...');

      const base64 = await pickBillImage();
      if (!base64) return;

      setStatus('Extracting date with AI...');
      const date = await extractDueDateFromBill(base64);

      if (!date) {
        Alert.alert(
          'No date found',
          'Could not find a due date on this bill. Try a clearer photo.'
        );
        return;
      }

      setDueDate(date);
      setStatus('Scheduling reminder...');
      await scheduleBillReminder(date, 'Bill');
      setStatus('Done! Reminder set.');

    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bill Scanner</Text>
      <Text style={styles.sub}>Scan a bill to set a payment reminder</Text>

      {dueDate && (
        <View style={styles.result}>
          <Text style={styles.label}>Due date found</Text>
          <Text style={styles.date}>
            {format(parseISO(dueDate), 'MMMM d, yyyy')}
          </Text>
          <Text style={styles.confirm}>✓ Reminder scheduled</Text>
        </View>
      )}

      {loading ? (
        <>
          <ActivityIndicator size="large" color="#185FA5" />
          <Text style={styles.status}>{status}</Text>
        </>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={handleScanBill}>
          <Text style={styles.btnText}>Scan a bill</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title:     { fontSize: 28, fontWeight: '600', marginBottom: 8 },
  sub:       { fontSize: 15, color: '#666', marginBottom: 32, textAlign: 'center' },
  result:    { alignItems: 'center', marginBottom: 32, padding: 20, backgroundColor: '#EAF3DE', borderRadius: 12, width: '100%' },
  label:     { fontSize: 13, color: '#3B6D11', marginBottom: 4 },
  date:      { fontSize: 22, fontWeight: '600', color: '#27500A' },
  confirm:   { fontSize: 13, color: '#3B6D11', marginTop: 6 },
  status:    { marginTop: 12, color: '#666', fontSize: 14 },
  btn:       { backgroundColor: '#185FA5', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

---

## 8. Test & Run

### Option A — Development build (recommended, supports notifications)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build for Android
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios
```

### Option B — Expo Go (quick test, no notifications)

```bash
npx expo start
```

### Validation checklist

- [ ] Camera opens when tapping "Scan a bill"
- [ ] A clear bill photo returns a date in `YYYY-MM-DD` format
- [ ] Blurry or non-bill image shows "no date found" alert
- [ ] Notification fires correctly (test with a date 1–2 minutes ahead)
- [ ] No API key exposed in console logs

---

## Upgrade Path

Once users validate the idea, upgrade with these two changes:

### 1. Move API call to a backend

Before shipping to real users, proxy the OpenRouter call through a simple backend so the API key is not bundled in the app binary.

```
React Native → Your API (Vercel / Cloudflare Worker) → OpenRouter
```

### 2. Swap to a more accurate model

Change one line in `extractDate.ts`:

```typescript
// Validation (free)
const MODEL = 'qwen/qwen-2-vl-7b-instruct';

// Production (paid, higher accuracy)
const MODEL = 'openai/gpt-4o';
```

---

## File Structure

```
BillScanner/
├── src/
│   └── services/
│       ├── imagePicker.ts      ← camera + base64 conversion
│       ├── extractDate.ts      ← OpenRouter vision API call
│       └── notifications.ts    ← schedule local reminders
├── App.tsx                     ← main screen, wires everything together
├── app.json                    ← Expo config + permissions
├── .env                        ← EXPO_PUBLIC_OPENROUTER_KEY
└── package.json
```

---

*Built for validation. Swap the model, add a backend, and this is production-ready.*
