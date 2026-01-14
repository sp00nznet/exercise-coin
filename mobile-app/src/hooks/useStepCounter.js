import { useState, useEffect, useRef, useCallback } from 'react';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

export function useStepCounter() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [stepsPerSecond, setStepsPerSecond] = useState(0);
  const [error, setError] = useState(null);

  const subscriptionRef = useRef(null);
  const previousStepsRef = useRef(0);
  const intervalRef = useRef(null);
  const stepDataBufferRef = useRef([]);
  const currentStepsRef = useRef(0);

  // Check if pedometer is available
  useEffect(() => {
    async function checkAvailability() {
      try {
        const available = await Pedometer.isAvailableAsync();
        setIsAvailable(available);
        if (!available) {
          setError('Step counter not available on this device');
        }
      } catch (err) {
        setError('Failed to check pedometer availability');
        setIsAvailable(false);
      }
    }

    checkAvailability();
  }, []);

  const startTracking = useCallback(async () => {
    if (!isAvailable) {
      return { success: false, error: 'Step counter not available' };
    }

    try {
      // Reset state
      setCurrentSteps(0);
      setStepsPerSecond(0);
      previousStepsRef.current = 0;
      stepDataBufferRef.current = [];
      currentStepsRef.current = 0;

      // Subscribe to step updates
      subscriptionRef.current = Pedometer.watchStepCount((result) => {
        setCurrentSteps(result.steps);
        currentStepsRef.current = result.steps;
      });

      // Calculate steps per second every second
      intervalRef.current = setInterval(() => {
        const currentTotal = currentStepsRef.current;
        const stepsDiff = currentTotal - previousStepsRef.current;
        previousStepsRef.current = currentTotal;

        setStepsPerSecond(stepsDiff);

        // Add to buffer for sending to server
        stepDataBufferRef.current.push({
          timestamp: new Date().toISOString(),
          stepCount: stepsDiff,
          stepsPerSecond: stepsDiff
        });
      }, 1000);

      setIsTracking(true);
      setError(null);

      return { success: true };
    } catch (err) {
      setError('Failed to start step tracking');
      return { success: false, error: err.message };
    }
  }, [isAvailable]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const finalStepData = [...stepDataBufferRef.current];
    stepDataBufferRef.current = [];

    setIsTracking(false);

    return { success: true, stepData: finalStepData };
  }, []);

  const getBufferedStepData = useCallback(() => {
    const data = [...stepDataBufferRef.current];
    stepDataBufferRef.current = [];
    return data;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isAvailable,
    isTracking,
    currentSteps,
    stepsPerSecond,
    error,
    startTracking,
    stopTracking,
    getBufferedStepData
  };
}
