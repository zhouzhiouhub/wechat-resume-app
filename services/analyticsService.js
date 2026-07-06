const cloudDataService = require('./cloudDataService');

const STORAGE_KEY = 'resume_analytics_events';
const MAX_STORED_EVENTS = 200;

const EVENT_NAMES = {
  PAGE_VIEW: 'page_view',
  PAGE_STAY: 'page_stay',
  PROJECT_OPEN: 'project_open',
  PROJECT_DETAIL_VIEW: 'project_detail_view',
  CONTACT_COPY: 'contact_copy',
  CONTACT_QR: 'contact_qr',
  POSTER_OPEN: 'poster_open',
  POSTER_SAVE: 'poster_save',
  FEEDBACK_OPEN: 'feedback_open',
  FEEDBACK_SUBMIT: 'feedback_submit',
  ADMIN_OPEN: 'admin_open'
};

const EVENT_LABELS = {
  [EVENT_NAMES.PAGE_VIEW]: '访问页面',
  [EVENT_NAMES.PAGE_STAY]: '停留时长',
  [EVENT_NAMES.PROJECT_OPEN]: '点击项目',
  [EVENT_NAMES.PROJECT_DETAIL_VIEW]: '查看项目',
  [EVENT_NAMES.CONTACT_COPY]: '复制邮箱',
  [EVENT_NAMES.CONTACT_QR]: '查看微信',
  [EVENT_NAMES.POSTER_OPEN]: '打开海报',
  [EVENT_NAMES.POSTER_SAVE]: '保存海报',
  [EVENT_NAMES.FEEDBACK_OPEN]: '打开留言',
  [EVENT_NAMES.FEEDBACK_SUBMIT]: '提交留言',
  [EVENT_NAMES.ADMIN_OPEN]: '打开看板'
};

function getKnownEventNames() {
  return Object.keys(EVENT_LABELS);
}

function assertKnownEventName(eventName) {
  if (getKnownEventNames().indexOf(eventName) === -1) {
    throw new Error(`Unknown analytics event: ${eventName}`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizePayload(payload) {
  if (!isPlainObject(payload)) {
    return {};
  }

  return Object.keys(payload).reduce((result, key) => {
    const value = payload[key];

    if (value !== undefined && typeof value !== 'function') {
      result[key] = value;
    }

    return result;
  }, {});
}

function getTimestamp(options = {}) {
  return typeof options.now === 'number' && Number.isFinite(options.now)
    ? options.now
    : Date.now();
}

function createEventId(eventName, timestamp, options = {}) {
  if (typeof options.eventId === 'string' && options.eventId.trim()) {
    return options.eventId.trim();
  }

  return `${timestamp}_${eventName}_${Math.floor(Math.random() * 1000000)}`;
}

function createAnalyticsEvent(eventName, payload = {}, options = {}) {
  assertKnownEventName(eventName);

  const timestamp = getTimestamp(options);

  return {
    id: createEventId(eventName, timestamp, options),
    name: eventName,
    label: EVENT_LABELS[eventName],
    timestamp,
    payload: normalizePayload(payload)
  };
}

function readEvents(wxApi) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function') {
    return [];
  }

  try {
    const events = wxApi.getStorageSync(STORAGE_KEY);

    return Array.isArray(events) ? events : [];
  } catch (error) {
    return [];
  }
}

function writeEvents(wxApi, events) {
  if (!wxApi || typeof wxApi.setStorageSync !== 'function') {
    return events;
  }

  const safeEvents = Array.isArray(events)
    ? events.slice(-MAX_STORED_EVENTS)
    : [];

  try {
    wxApi.setStorageSync(STORAGE_KEY, safeEvents);
  } catch (error) {
    return safeEvents;
  }

  return safeEvents;
}

function recordEvent(wxApi, eventName, payload = {}, options = {}) {
  const event = createAnalyticsEvent(eventName, payload, options);
  const events = readEvents(wxApi);

  writeEvents(wxApi, events.concat(event));
  syncEventToCloud(wxApi, event, options);

  return event;
}

function syncEventToCloud(wxApi, event, options = {}) {
  if (options.syncCloud === false) {
    return;
  }

  cloudDataService.syncAnalyticsEvent(wxApi, event, options)
    .then((result) => result)
    .catch(() => null);
}

function clearEvents(wxApi) {
  if (!wxApi) {
    return;
  }

  try {
    if (typeof wxApi.removeStorageSync === 'function') {
      wxApi.removeStorageSync(STORAGE_KEY);
      return;
    }

    writeEvents(wxApi, []);
  } catch (error) {
    writeEvents(wxApi, []);
  }
}

function countEvents(events, eventNames) {
  return events.filter((event) => eventNames.indexOf(event.name) !== -1).length;
}

function getAverageStaySeconds(events) {
  const stayDurations = events
    .filter((event) => event.name === EVENT_NAMES.PAGE_STAY)
    .map((event) => Number(event.payload && event.payload.durationMs))
    .filter((durationMs) => Number.isFinite(durationMs) && durationMs > 0);

  if (!stayDurations.length) {
    return 0;
  }

  const totalDuration = stayDurations.reduce((sum, durationMs) => sum + durationMs, 0);

  return Math.round(totalDuration / stayDurations.length / 1000);
}

function getProjectLabel(event) {
  const payload = event.payload || {};

  return payload.projectName || payload.projectId || '未命名项目';
}

function getTopProjects(events) {
  const projectCounts = events
    .filter((event) => event.name === EVENT_NAMES.PROJECT_OPEN)
    .reduce((result, event) => {
      const label = getProjectLabel(event);

      result[label] = (result[label] || 0) + 1;
      return result;
    }, {});

  return Object.keys(projectCounts)
    .map((name) => ({
      name,
      count: projectCounts[name]
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function toTwoDigits(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function formatEventTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${toTwoDigits(date.getMonth() + 1)}-${toTwoDigits(date.getDate())} ${toTwoDigits(date.getHours())}:${toTwoDigits(date.getMinutes())}`;
}

function getEventTargetText(event) {
  const payload = event.payload || {};

  return payload.projectName
    || payload.projectId
    || payload.page
    || payload.feedbackType
    || payload.source
    || '';
}

function getRecentEvents(events, limit = 8) {
  return events
    .slice()
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      name: event.name,
      label: event.label || EVENT_LABELS[event.name] || event.name,
      targetText: getEventTargetText(event),
      timeText: formatEventTime(event.timestamp)
    }));
}

function getDashboardMetrics(events = []) {
  const safeEvents = Array.isArray(events) ? events : [];

  return {
    totalEvents: safeEvents.length,
    totalVisits: countEvents(safeEvents, [EVENT_NAMES.PAGE_VIEW]),
    projectClickCount: countEvents(safeEvents, [EVENT_NAMES.PROJECT_OPEN]),
    contactClickCount: countEvents(safeEvents, [
      EVENT_NAMES.CONTACT_COPY,
      EVENT_NAMES.CONTACT_QR,
      EVENT_NAMES.POSTER_OPEN
    ]),
    averageStaySeconds: getAverageStaySeconds(safeEvents),
    feedbackSubmitCount: countEvents(safeEvents, [EVENT_NAMES.FEEDBACK_SUBMIT]),
    topProjects: getTopProjects(safeEvents),
    recentEvents: getRecentEvents(safeEvents)
  };
}

function createDashboardState(wxApi) {
  const events = readEvents(wxApi);

  return {
    events,
    metrics: getDashboardMetrics(events)
  };
}

module.exports = {
  STORAGE_KEY,
  MAX_STORED_EVENTS,
  EVENT_NAMES,
  EVENT_LABELS,
  createAnalyticsEvent,
  recordEvent,
  readEvents,
  writeEvents,
  clearEvents,
  getDashboardMetrics,
  createDashboardState
};
