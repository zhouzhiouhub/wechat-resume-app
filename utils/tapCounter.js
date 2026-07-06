const DEFAULT_REQUIRED_TAPS = 5;
const DEFAULT_TIMEOUT_MS = 1600;

function normalizePositiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function createTapState(options = {}) {
  return {
    count: 0,
    lastTapAt: 0,
    requiredTaps: normalizePositiveInteger(options.requiredTaps, DEFAULT_REQUIRED_TAPS),
    timeoutMs: normalizePositiveInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS),
    isTriggered: false
  };
}

function normalizeTapState(state) {
  if (!state || typeof state !== 'object') {
    return createTapState();
  }

  return {
    count: normalizePositiveInteger(state.count, 0),
    lastTapAt: typeof state.lastTapAt === 'number' ? state.lastTapAt : 0,
    requiredTaps: normalizePositiveInteger(state.requiredTaps, DEFAULT_REQUIRED_TAPS),
    timeoutMs: normalizePositiveInteger(state.timeoutMs, DEFAULT_TIMEOUT_MS),
    isTriggered: false
  };
}

function getTapTime(tapAt) {
  return typeof tapAt === 'number' && Number.isFinite(tapAt) ? tapAt : Date.now();
}

function recordTap(state, tapAt) {
  const currentState = normalizeTapState(state);
  const currentTapAt = getTapTime(tapAt);
  const isExpired = currentState.lastTapAt > 0
    && currentTapAt - currentState.lastTapAt > currentState.timeoutMs;
  const nextCount = isExpired ? 1 : currentState.count + 1;
  const isTriggered = nextCount >= currentState.requiredTaps;

  return {
    ...currentState,
    count: isTriggered ? 0 : nextCount,
    lastTapAt: isTriggered ? 0 : currentTapAt,
    isTriggered
  };
}

module.exports = {
  DEFAULT_REQUIRED_TAPS,
  DEFAULT_TIMEOUT_MS,
  createTapState,
  recordTap
};
