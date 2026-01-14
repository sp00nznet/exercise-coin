import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState
} from 'react-native';
import { useStepCounter } from '../hooks/useStepCounter';
import { useExerciseStore } from '../stores/exerciseStore';
import api from '../services/api';

export default function ExerciseScreen() {
  const {
    isAvailable,
    isTracking,
    currentSteps,
    stepsPerSecond,
    error: stepError,
    startTracking,
    stopTracking,
    getBufferedStepData
  } = useStepCounter();

  const {
    currentSession,
    isExercising,
    totalSteps,
    elapsedSeconds,
    startSession,
    recordSteps,
    endSession,
    addLocalStepData
  } = useExerciseStore();

  const [sessionResult, setSessionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const uploadIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Timer for elapsed time
  useEffect(() => {
    if (isExercising) {
      timerRef.current = setInterval(() => {
        useExerciseStore.setState((state) => ({
          elapsedSeconds: state.elapsedSeconds + 1
        }));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExercising]);

  // Upload step data periodically
  useEffect(() => {
    if (isExercising && currentSession) {
      uploadIntervalRef.current = setInterval(async () => {
        const stepData = getBufferedStepData();
        if (stepData.length > 0) {
          await recordSteps(stepData);
        }
      }, 10000); // Upload every 10 seconds
    }

    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    };
  }, [isExercising, currentSession, getBufferedStepData, recordSteps]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        nextAppState === 'background' &&
        isExercising
      ) {
        // App going to background while exercising - continue tracking
        console.log('App in background, continuing exercise tracking');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isExercising]);

  const handleStart = async () => {
    if (!isAvailable) {
      Alert.alert('Error', 'Step counter is not available on this device');
      return;
    }

    setLoading(true);
    setSessionResult(null);

    // Start server session
    const sessionRes = await startSession();
    if (!sessionRes.success) {
      Alert.alert('Error', sessionRes.error);
      setLoading(false);
      return;
    }

    // Start local step tracking
    const trackRes = await startTracking();
    if (!trackRes.success) {
      Alert.alert('Error', trackRes.error);
      await endSession();
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);

    // Stop local tracking
    const trackResult = stopTracking();

    // Upload any remaining step data
    if (trackResult.stepData?.length > 0) {
      await recordSteps(trackResult.stepData);
    }

    // End server session and get results
    const result = await endSession();

    if (result.success) {
      setSessionResult(result.session);
    } else {
      Alert.alert('Error', result.error);
    }

    setLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSessionResult = () => {
    if (!sessionResult) return null;

    const isRewarded = sessionResult.status === 'rewarded';

    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>
          {isRewarded ? 'Great Workout!' : 'Session Completed'}
        </Text>

        <View style={styles.resultStats}>
          <View style={styles.resultStat}>
            <Text style={styles.resultValue}>{sessionResult.totalSteps}</Text>
            <Text style={styles.resultLabel}>Total Steps</Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={styles.resultValue}>
              {formatTime(sessionResult.durationSeconds)}
            </Text>
            <Text style={styles.resultLabel}>Duration</Text>
          </View>
        </View>

        {isRewarded ? (
          <View style={styles.rewardSection}>
            <Text style={styles.rewardLabel}>You earned</Text>
            <Text style={styles.rewardAmount}>
              +{sessionResult.coinsEarned?.toFixed(4)} EXC
            </Text>
            <Text style={styles.miningInfo}>
              Mining time: {sessionResult.miningDurationSeconds}s
            </Text>
          </View>
        ) : (
          <View style={styles.noRewardSection}>
            <Text style={styles.noRewardText}>
              {sessionResult.invalidReason || 'Keep exercising to earn rewards!'}
            </Text>
            <Text style={styles.tipText}>
              Tip: Exercise for at least 60 continuous seconds at a walking pace
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.newSessionButton}
          onPress={() => setSessionResult(null)}
        >
          <Text style={styles.newSessionButtonText}>Start New Session</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (sessionResult) {
    return (
      <View style={styles.container}>
        {renderSessionResult()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isExercising ? (
        <View style={styles.idleState}>
          <Text style={styles.title}>Ready to Exercise?</Text>
          <Text style={styles.description}>
            Start a session to track your steps and earn Exercise Coin.
            Walk or run for at least 60 seconds to qualify for mining rewards.
          </Text>

          {stepError && (
            <Text style={styles.errorText}>{stepError}</Text>
          )}

          <TouchableOpacity
            style={[styles.startButton, loading && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={loading || !isAvailable}
          >
            <Text style={styles.startButtonText}>
              {loading ? 'Starting...' : 'Start Exercise'}
            </Text>
          </TouchableOpacity>

          {!isAvailable && (
            <Text style={styles.warningText}>
              Step counter not available on this device
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.activeState}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.timerLabel}>Elapsed Time</Text>
          </View>

          <View style={styles.liveStats}>
            <View style={styles.liveStat}>
              <Text style={styles.liveValue}>{currentSteps}</Text>
              <Text style={styles.liveLabel}>Total Steps</Text>
            </View>
            <View style={styles.liveStat}>
              <Text style={styles.liveValue}>{stepsPerSecond.toFixed(1)}</Text>
              <Text style={styles.liveLabel}>Steps/sec</Text>
            </View>
          </View>

          <View style={styles.progressInfo}>
            {elapsedSeconds < 60 ? (
              <Text style={styles.progressText}>
                Keep going! {60 - elapsedSeconds}s until mining eligibility
              </Text>
            ) : (
              <Text style={styles.progressTextGreen}>
                Mining eligible! Keep exercising for more rewards
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.stopButton, loading && styles.buttonDisabled]}
            onPress={handleStop}
            disabled={loading}
          >
            <Text style={styles.stopButtonText}>
              {loading ? 'Finishing...' : 'Stop Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 20
  },
  idleState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24
  },
  startButton: {
    backgroundColor: '#e94560',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30
  },
  buttonDisabled: {
    opacity: 0.6
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 20
  },
  warningText: {
    color: '#f59e0b',
    marginTop: 16
  },
  activeState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff'
  },
  timerLabel: {
    color: '#888',
    marginTop: 4
  },
  liveStats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30
  },
  liveStat: {
    alignItems: 'center'
  },
  liveValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e94560'
  },
  liveLabel: {
    color: '#888',
    marginTop: 4
  },
  progressInfo: {
    marginBottom: 40
  },
  progressText: {
    color: '#f59e0b',
    fontSize: 16
  },
  progressTextGreen: {
    color: '#4ade80',
    fontSize: 16
  },
  stopButton: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#e94560',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30
  },
  stopButtonText: {
    color: '#e94560',
    fontSize: 20,
    fontWeight: '600'
  },
  resultCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30
  },
  resultStats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30
  },
  resultStat: {
    alignItems: 'center'
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  resultLabel: {
    color: '#888',
    marginTop: 4
  },
  rewardSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ade80',
    marginBottom: 30
  },
  rewardLabel: {
    color: '#888',
    fontSize: 16
  },
  rewardAmount: {
    color: '#4ade80',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8
  },
  miningInfo: {
    color: '#888',
    fontSize: 14
  },
  noRewardSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30
  },
  noRewardText: {
    color: '#f59e0b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12
  },
  tipText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center'
  },
  newSessionButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30
  },
  newSessionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  }
});
