# Mobile App Guide

Development guide for the Exercise Coin mobile application.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Core Components](#core-components)
- [State Management](#state-management)
- [Step Tracking](#step-tracking)
- [Customization](#customization)
- [Building for Production](#building-for-production)

---

## Overview

The Exercise Coin mobile app is built with:

- **React Native** - Cross-platform mobile framework
- **Expo** - Development toolchain and runtime
- **Zustand** - Lightweight state management
- **Expo Sensors** - Device pedometer access

### Supported Platforms

| Platform | Minimum Version |
|----------|-----------------|
| iOS | 13.0+ |
| Android | API 23 (6.0)+ |

---

## Project Structure

```
mobile-app/
├── App.js                    # Entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
└── src/
    ├── screens/              # App screens
    │   ├── LoginScreen.js
    │   ├── RegisterScreen.js
    │   ├── HomeScreen.js
    │   ├── ExerciseScreen.js
    │   ├── WalletScreen.js
    │   └── ProfileScreen.js
    ├── hooks/
    │   └── useStepCounter.js # Pedometer hook
    ├── stores/
    │   ├── authStore.js      # Authentication state
    │   └── exerciseStore.js  # Exercise session state
    ├── services/
    │   └── api.js            # API client
    ├── components/           # Reusable components
    └── utils/                # Helper functions
```

---

## Development Setup

### Prerequisites

```bash
# Install Node.js 18+
node --version  # Should be 18.x or higher

# Install Expo CLI
npm install -g expo-cli
```

### Installation

```bash
cd mobile-app

# Install dependencies
npm install

# Start development server
npm start
```

### Running on Device

1. Install **Expo Go** from App Store / Play Store
2. Scan the QR code from terminal
3. App loads on your device

### Running on Simulator

```bash
# iOS (macOS only)
npm run ios

# Android (requires Android Studio)
npm run android
```

### Environment Configuration

Create `.env` file:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

> Use your computer's local IP for device testing

---

## Core Components

### Navigation

The app uses React Navigation with a bottom tab navigator:

```javascript
// App.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Exercise" component={ExerciseScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

### Screen Components

Each screen follows this pattern:

```javascript
export default function ScreenName() {
  // State hooks
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Screen content */}
    </ScrollView>
  );
}
```

---

## State Management

### Auth Store

Manages authentication state with secure storage:

```javascript
// src/stores/authStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const response = await api.login(email, password);
    await SecureStore.setItemAsync('token', response.token);
    set({ token: response.token, user: response.user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ token: null, user: null });
  }
}));
```

### Exercise Store

Manages exercise session state:

```javascript
// src/stores/exerciseStore.js
export const useExerciseStore = create((set, get) => ({
  currentSession: null,
  isExercising: false,
  stepData: [],
  totalSteps: 0,

  startSession: async () => {
    const response = await api.startExerciseSession();
    set({
      currentSession: { id: response.sessionId },
      isExercising: true
    });
  },

  endSession: async () => {
    const { currentSession } = get();
    const result = await api.endExerciseSession(currentSession.id);
    set({ currentSession: null, isExercising: false });
    return result;
  }
}));
```

---

## Step Tracking

### Pedometer Hook

The `useStepCounter` hook provides access to device pedometer:

```javascript
// src/hooks/useStepCounter.js
import { Pedometer } from 'expo-sensors';

export function useStepCounter() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [stepsPerSecond, setStepsPerSecond] = useState(0);

  // Check availability
  useEffect(() => {
    Pedometer.isAvailableAsync().then(setIsAvailable);
  }, []);

  const startTracking = async () => {
    // Subscribe to step updates
    subscription = Pedometer.watchStepCount(result => {
      setCurrentSteps(result.steps);
    });

    // Calculate steps per second
    interval = setInterval(() => {
      const diff = currentSteps - previousSteps;
      setStepsPerSecond(diff);
      previousSteps = currentSteps;
    }, 1000);
  };

  const stopTracking = () => {
    subscription?.remove();
    clearInterval(interval);
  };

  return {
    isAvailable,
    currentSteps,
    stepsPerSecond,
    startTracking,
    stopTracking
  };
}
```

### Using in Exercise Screen

```javascript
// src/screens/ExerciseScreen.js
export default function ExerciseScreen() {
  const {
    isAvailable,
    currentSteps,
    stepsPerSecond,
    startTracking,
    stopTracking
  } = useStepCounter();

  const { startSession, endSession, isExercising } = useExerciseStore();

  const handleStart = async () => {
    await startSession();
    await startTracking();
  };

  const handleStop = async () => {
    stopTracking();
    const result = await endSession();
    // Show results
  };

  return (
    <View>
      {isExercising ? (
        <>
          <Text>Steps: {currentSteps}</Text>
          <Text>Rate: {stepsPerSecond}/sec</Text>
          <Button title="Stop" onPress={handleStop} />
        </>
      ) : (
        <Button title="Start Exercise" onPress={handleStart} />
      )}
    </View>
  );
}
```

---

## Customization

### Theme Colors

The app uses a dark theme. Modify colors in your screens:

```javascript
const colors = {
  background: '#0f0f23',
  card: '#1a1a2e',
  primary: '#e94560',
  success: '#4ade80',
  warning: '#f59e0b',
  text: '#ffffff',
  textSecondary: '#888888'
};
```

### App Configuration

Modify `app.json` for app metadata:

```json
{
  "expo": {
    "name": "Exercise Coin",
    "slug": "exercise-coin",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#1a1a2e"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.exercisecoin"
    },
    "android": {
      "package": "com.yourcompany.exercisecoin"
    }
  }
}
```

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add to navigation in `App.js`
3. Add tab icon if needed

---

## Building for Production

### Expo Build Service (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Local Builds

For iOS (macOS required):

```bash
expo run:ios --configuration Release
```

For Android:

```bash
expo run:android --variant release
```

### App Store Submission

1. Build production binary with EAS
2. Download from Expo dashboard
3. Upload to App Store Connect / Play Console
4. Complete store listing
5. Submit for review

---

## Troubleshooting

### Pedometer Not Working

```javascript
// Check permissions
import { Pedometer } from 'expo-sensors';

const available = await Pedometer.isAvailableAsync();
if (!available) {
  // Show message to user
  Alert.alert('Error', 'Step counter not available on this device');
}
```

### API Connection Issues

1. Ensure server is running
2. Check API URL in `.env`
3. Use device's network IP, not `localhost`
4. Check firewall allows port 3000

### State Not Updating

```javascript
// Force component re-render
const forceUpdate = useReducer(x => x + 1, 0)[1];

// Or use key prop to reset component
<ExerciseScreen key={sessionId} />
```
