const logger = require('../utils/logger');

class ExerciseDetectionService {
  constructor() {
    // Configuration for exercise detection
    this.MIN_EXERCISE_DURATION = parseInt(process.env.MIN_EXERCISE_DURATION_SECONDS) || 60;
    this.STEPS_PER_SECOND_MIN = parseFloat(process.env.STEPS_PER_SECOND_MIN) || 1;
    this.STEPS_PER_SECOND_MAX = parseFloat(process.env.STEPS_PER_SECOND_MAX) || 5;
    this.MINING_RATIO = parseFloat(process.env.MINING_SECONDS_PER_EXERCISE_SECOND) || 0.5;

    // Anti-cheat thresholds
    this.VARIANCE_THRESHOLD = 0.1; // Minimum variance in step rate (prevents constant rate cheating)
    this.MAX_CONSECUTIVE_IDENTICAL = 10; // Max identical readings before flagging
    this.ACCELERATION_THRESHOLD = 3; // Max sudden change in steps per second
  }

  analyzeExerciseSession(stepData) {
    if (!stepData || stepData.length < 2) {
      return {
        isValid: false,
        reason: 'Insufficient step data',
        validSeconds: 0,
        miningSeconds: 0
      };
    }

    const analysis = {
      isValid: false,
      reason: null,
      validSeconds: 0,
      miningSeconds: 0,
      suspiciousPatterns: [],
      averageStepsPerSecond: 0,
      variance: 0
    };

    // Extract step rates
    const stepRates = stepData.map(d => d.stepsPerSecond);

    // Calculate statistics
    const avgRate = stepRates.reduce((a, b) => a + b, 0) / stepRates.length;
    const variance = this.calculateVariance(stepRates, avgRate);

    analysis.averageStepsPerSecond = avgRate;
    analysis.variance = variance;

    // Check for suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(stepData);
    analysis.suspiciousPatterns = suspiciousPatterns;

    if (suspiciousPatterns.length > 0) {
      analysis.isValid = false;
      analysis.reason = `Suspicious patterns detected: ${suspiciousPatterns.join(', ')}`;
      return analysis;
    }

    // Count valid exercise seconds
    let validSeconds = 0;
    let consecutiveValidSeconds = 0;
    let maxConsecutiveValid = 0;

    for (let i = 0; i < stepData.length; i++) {
      const rate = stepData[i].stepsPerSecond;

      if (rate >= this.STEPS_PER_SECOND_MIN && rate <= this.STEPS_PER_SECOND_MAX) {
        validSeconds++;
        consecutiveValidSeconds++;
        maxConsecutiveValid = Math.max(maxConsecutiveValid, consecutiveValidSeconds);
      } else {
        consecutiveValidSeconds = 0;
      }
    }

    analysis.validSeconds = validSeconds;

    // Check if minimum exercise duration met
    if (maxConsecutiveValid < this.MIN_EXERCISE_DURATION) {
      analysis.isValid = false;
      analysis.reason = `Exercise duration too short. Need ${this.MIN_EXERCISE_DURATION}s consecutive, got ${maxConsecutiveValid}s`;
      return analysis;
    }

    // Check variance (detect paint mixer or mechanical devices)
    if (variance < this.VARIANCE_THRESHOLD) {
      analysis.isValid = false;
      analysis.reason = 'Step rate too consistent - possible mechanical device detected';
      return analysis;
    }

    // Valid exercise session
    analysis.isValid = true;
    analysis.miningSeconds = Math.floor(validSeconds * this.MINING_RATIO);

    logger.info(`Exercise session validated: ${validSeconds}s valid, ${analysis.miningSeconds}s mining awarded`);

    return analysis;
  }

  detectSuspiciousPatterns(stepData) {
    const patterns = [];

    // Check for too many identical consecutive readings
    let consecutiveIdentical = 1;
    for (let i = 1; i < stepData.length; i++) {
      if (stepData[i].stepsPerSecond === stepData[i-1].stepsPerSecond) {
        consecutiveIdentical++;
        if (consecutiveIdentical > this.MAX_CONSECUTIVE_IDENTICAL) {
          patterns.push('identical_readings');
          break;
        }
      } else {
        consecutiveIdentical = 1;
      }
    }

    // Check for sudden impossible accelerations
    for (let i = 1; i < stepData.length; i++) {
      const acceleration = Math.abs(stepData[i].stepsPerSecond - stepData[i-1].stepsPerSecond);
      if (acceleration > this.ACCELERATION_THRESHOLD) {
        patterns.push('impossible_acceleration');
        break;
      }
    }

    // Check for perfectly periodic patterns (mechanical device)
    if (this.detectPeriodicPattern(stepData)) {
      patterns.push('periodic_pattern');
    }

    // Check for unrealistic step rates
    const maxRate = Math.max(...stepData.map(d => d.stepsPerSecond));
    if (maxRate > 10) { // More than 10 steps per second is humanly impossible
      patterns.push('superhuman_speed');
    }

    return [...new Set(patterns)]; // Remove duplicates
  }

  detectPeriodicPattern(stepData) {
    if (stepData.length < 20) return false;

    // Check for repeating patterns of length 2-5
    for (let periodLength = 2; periodLength <= 5; periodLength++) {
      let matchCount = 0;
      for (let i = periodLength; i < stepData.length; i++) {
        if (Math.abs(stepData[i].stepsPerSecond - stepData[i - periodLength].stepsPerSecond) < 0.01) {
          matchCount++;
        }
      }
      // If more than 80% match the period, it's suspicious
      if (matchCount / (stepData.length - periodLength) > 0.8) {
        return true;
      }
    }
    return false;
  }

  calculateVariance(values, mean) {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  calculateMiningDuration(validExerciseSeconds) {
    return Math.floor(validExerciseSeconds * this.MINING_RATIO);
  }
}

module.exports = new ExerciseDetectionService();
