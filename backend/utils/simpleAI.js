// Simple AI for Study Schedule Optimization
// It learns patterns from user study behavior and makes predictions
// STEP 1: Store training data (study sessions and their outcomes)
class StudyAI {
  constructor() {
    this.trainingData = []; // Stores past study sessions
    this.weights = {
      timeOfDay: 0.3,
      subjectDifficulty: 0.4,
      dayOfWeek: 0.2,
      recentStreak: 0.1
    };
  }

  // STEP 2: Add training data (learning phase)
  // Each time user completes a study session, we learn from it
  addTrainingData(session) {
    this.trainingData.push({
      timeOfDay: this.normalizeTime(session.timeOfDay), // Convert time to 0-1 scale
      subjectDifficulty: session.subjectDifficulty / 5, // Difficulty 1-5 to 0-1
      dayOfWeek: this.normalizeDayOfWeek(session.dayOfWeek), // Mon=0, Sun=6
      completed: session.completed ? 1 : 0, // Success = 1, Fail = 0
      focusScore: session.focusScore || 0.5 // How well they focused (0-1)
    });
  }

  // STEP 3: Make predictions (using learned patterns)
  // Given a time and subject, predict success probability
  predictSuccess(timeOfDay, subjectDifficulty, dayOfWeek, recentStreak) {
    // If no training data yet, return default
    if (this.trainingData.length === 0) {
      return 0.5; // 50% by default
    }

    // Normalize inputs
    const normalizedTime = this.normalizeTime(timeOfDay);
    const normalizedDiff = subjectDifficulty / 5;
    const normalizedDay = this.normalizeDayOfWeek(dayOfWeek);
    const normalizedStreak = Math.min(recentStreak / 7, 1); // Max out at 7 days

    // Find similar past sessions
    let totalSimilarity = 0;
    let weightedSuccess = 0;

    for (let i = 0; i < this.trainingData.length; i++) {
      const data = this.trainingData[i];

      // calculate similarity (how close this specific past session is to current scenario)
      const timeSimilarity = 1 - Math.abs(data.timeOfDay - normalizedTime);
      const diffSimilarity = 1 - Math.abs(data.subjectDifficulty - normalizedDiff);
      const daySimilarity = 1 - Math.abs(data.dayOfWeek - normalizedDay);

      // Weighted similarity score
      const similarity =
        (timeSimilarity * this.weights.timeOfDay) +
        (diffSimilarity * this.weights.subjectDifficulty) +
        (daySimilarity * this.weights.dayOfWeek);

      totalSimilarity += similarity;
      weightedSuccess += similarity * data.completed;
    }

    // Calculate prediction (weighted average of similar sessions)
    const prediction = totalSimilarity > 0 ? weightedSuccess / totalSimilarity : 0.5;

    // Adjust for recent streak (good streak = slight boost)
    const streakBoost = normalizedStreak * 0.1;

    return Math.min(1, Math.max(0, prediction + streakBoost));
  }

  // STEP 4: Get AI insights (what the AI learned)
  getInsights() {
    if (this.trainingData.length < 5) {
      return {
        ready: false,
        message: "Need more study sessions to learn patterns (minimum 5)"
      };
    }

    // Analyze best time of day
    const morningSuccess = this.getSuccessRateForTimeRange(0, 0.4);
    const afternoonSuccess = this.getSuccessRateForTimeRange(0.4, 0.7);
    const eveningSuccess = this.getSuccessRateForTimeRange(0.7, 1);

    const bestTime =
      morningSuccess > afternoonSuccess && morningSuccess > eveningSuccess ? "Morning" :
      afternoonSuccess > eveningSuccess ? "Afternoon" : "Evening";

    const bestTimeScore = Math.max(morningSuccess, afternoonSuccess, eveningSuccess);

    // Analyze difficulty patterns
    const easySuccess = this.getSuccessRateForDifficulty(0, 0.4);
    const mediumSuccess = this.getSuccessRateForDifficulty(0.4, 0.7);
    const hardSuccess = this.getSuccessRateForDifficulty(0.7, 1);

    return {
      ready: true,
      totalSessions: this.trainingData.length,
      bestTimeOfDay: bestTime,
      bestTimeScore: Math.round(bestTimeScore * 100),
      morningSuccess: Math.round(morningSuccess * 100),
      afternoonSuccess: Math.round(afternoonSuccess * 100),
      eveningSuccess: Math.round(eveningSuccess * 100),
      easyTaskSuccess: Math.round(easySuccess * 100),
      mediumTaskSuccess: Math.round(mediumSuccess * 100),
      hardTaskSuccess: Math.round(hardSuccess * 100),
      recommendation: this.generateRecommendation(bestTime, bestTimeScore)
    };
  }

  // Helper: Calculate success rate for a time range
  getSuccessRateForTimeRange(minTime, maxTime) {
    const sessions = this.trainingData.filter(d =>
      d.timeOfDay >= minTime && d.timeOfDay < maxTime
    );

    if (sessions.length === 0) return 0;

    const successes = sessions.filter(d => d.completed === 1).length;
    return successes / sessions.length;
  }

  // Helper: Calculate success rate for difficulty range
  getSuccessRateForDifficulty(minDiff, maxDiff) {
    const sessions = this.trainingData.filter(d =>
      d.subjectDifficulty >= minDiff && d.subjectDifficulty < maxDiff
    );

    if (sessions.length === 0) return 0;

    const successes = sessions.filter(d => d.completed === 1).length;
    return successes / sessions.length;
  }

  // Helper: Generate recommendation text
  generateRecommendation(bestTime, score) {
    if (score > 0.8) {
      return `You excel during ${bestTime} sessions! Schedule difficult subjects then.`;
    } else if (score > 0.6) {
      return `${bestTime} works well for you. Consider this for important topics.`;
    } else {
      return `Try different study times to find your peak focus hours.`;
    }
  }

  // Helper: Convert time string to 0-1 scale
  normalizeTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours + minutes / 60) / 24;
  }

  // Helper: Convert day name to 0-6 scale
  normalizeDayOfWeek(dayName) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const index = days.indexOf(dayName);
    return index >= 0 ? index / 6 : 0.5;
  }

  // STEP 5: Save/load model (persist the AI's learning)
  exportModel() {
    return {
      trainingData: this.trainingData,
      weights: this.weights,
      version: '1.0'
    };
  }

  importModel(modelData) {
    if (modelData && modelData.trainingData) {
      this.trainingData = modelData.trainingData;
      this.weights = modelData.weights || this.weights;
    }
  }
}

// Export for use in controllers
export default StudyAI;
