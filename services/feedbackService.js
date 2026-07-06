const validator = require('../utils/validator');
const cloudDataService = require('./cloudDataService');

const STORAGE_KEY = 'resume_feedback_records';
const MAX_STORED_FEEDBACK = 100;
const MIN_CONTENT_LENGTH = 5;
const MAX_CONTENT_LENGTH = 300;
const DEFAULT_FEEDBACK_TYPE = 'question';

const FEEDBACK_TYPES = [
  {
    id: 'question',
    label: '问题'
  },
  {
    id: 'comment',
    label: '评价'
  },
  {
    id: 'opportunity',
    label: '机会'
  }
];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getFeedbackType(type) {
  return FEEDBACK_TYPES.find((item) => item.id === type) || FEEDBACK_TYPES[0];
}

function normalizeFeedbackInput(input = {}) {
  const type = normalizeText(input.type) || DEFAULT_FEEDBACK_TYPE;

  return {
    type: getFeedbackType(type).id,
    typeLabel: getFeedbackType(type).label,
    name: normalizeText(input.name),
    contact: normalizeText(input.contact),
    content: normalizeText(input.content)
  };
}

function getFeedbackTypeOptions(activeType = DEFAULT_FEEDBACK_TYPE) {
  const normalizedType = getFeedbackType(activeType).id;

  return FEEDBACK_TYPES.map((type) => ({
    ...type,
    isActive: type.id === normalizedType
  }));
}

function validateFeedbackInput(input = {}) {
  const value = normalizeFeedbackInput(input);
  const errors = [];

  if (value.content.length < MIN_CONTENT_LENGTH) {
    errors.push(`留言内容至少 ${MIN_CONTENT_LENGTH} 个字`);
  }

  if (value.content.length > MAX_CONTENT_LENGTH) {
    errors.push(`留言内容不能超过 ${MAX_CONTENT_LENGTH} 个字`);
  }

  if (value.name.length > 20) {
    errors.push('称呼不能超过 20 个字');
  }

  if (value.contact.length > 80) {
    errors.push('联系方式不能超过 80 个字');
  }

  if (value.contact.indexOf('@') !== -1 && !validator.isValidEmail(value.contact)) {
    errors.push('邮箱格式不正确');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value
  };
}

function getTimestamp(options = {}) {
  return typeof options.now === 'number' && Number.isFinite(options.now)
    ? options.now
    : Date.now();
}

function createFeedbackId(timestamp, options = {}) {
  if (typeof options.feedbackId === 'string' && options.feedbackId.trim()) {
    return options.feedbackId.trim();
  }

  return `${timestamp}_feedback_${Math.floor(Math.random() * 1000000)}`;
}

function createFeedbackRecord(input = {}, options = {}) {
  const validation = validateFeedbackInput(input);

  if (!validation.isValid) {
    throw new Error(validation.errors.join('; '));
  }

  const timestamp = getTimestamp(options);

  return {
    id: createFeedbackId(timestamp, options),
    type: validation.value.type,
    typeLabel: validation.value.typeLabel,
    name: validation.value.name,
    contact: validation.value.contact,
    content: validation.value.content,
    createdAt: timestamp
  };
}

function readFeedback(wxApi) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function') {
    return [];
  }

  try {
    const records = wxApi.getStorageSync(STORAGE_KEY);

    return Array.isArray(records) ? records : [];
  } catch (error) {
    return [];
  }
}

function writeFeedback(wxApi, records) {
  if (!wxApi || typeof wxApi.setStorageSync !== 'function') {
    return records;
  }

  const safeRecords = Array.isArray(records)
    ? records.slice(-MAX_STORED_FEEDBACK)
    : [];

  try {
    wxApi.setStorageSync(STORAGE_KEY, safeRecords);
  } catch (error) {
    return safeRecords;
  }

  return safeRecords;
}

function submitFeedback(wxApi, input = {}, options = {}) {
  const record = createFeedbackRecord(input, options);
  const records = readFeedback(wxApi);

  writeFeedback(wxApi, records.concat(record));
  syncFeedbackToCloud(wxApi, record, options);

  return record;
}

function syncFeedbackToCloud(wxApi, record, options = {}) {
  if (options.syncCloud === false) {
    return;
  }

  cloudDataService.syncFeedbackRecord(wxApi, record, options)
    .then((result) => result)
    .catch(() => null);
}

function clearFeedback(wxApi) {
  if (!wxApi) {
    return;
  }

  try {
    if (typeof wxApi.removeStorageSync === 'function') {
      wxApi.removeStorageSync(STORAGE_KEY);
      return;
    }

    writeFeedback(wxApi, []);
  } catch (error) {
    writeFeedback(wxApi, []);
  }
}

function toTwoDigits(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function formatFeedbackTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${toTwoDigits(date.getMonth() + 1)}-${toTwoDigits(date.getDate())} ${toTwoDigits(date.getHours())}:${toTwoDigits(date.getMinutes())}`;
}

function getFeedbackSummary(records = []) {
  const safeRecords = Array.isArray(records) ? records : [];
  const typeCounts = FEEDBACK_TYPES.map((type) => ({
    id: type.id,
    label: type.label,
    count: safeRecords.filter((record) => record.type === type.id).length
  }));

  return {
    total: safeRecords.length,
    typeCounts,
    latest: safeRecords
      .slice()
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, 5)
      .map((record) => ({
        ...record,
        timeText: formatFeedbackTime(record.createdAt)
      }))
  };
}

function createFeedbackForm(defaultType = DEFAULT_FEEDBACK_TYPE) {
  return {
    type: getFeedbackType(defaultType).id,
    name: '',
    contact: '',
    content: ''
  };
}

module.exports = {
  STORAGE_KEY,
  MAX_STORED_FEEDBACK,
  MIN_CONTENT_LENGTH,
  MAX_CONTENT_LENGTH,
  DEFAULT_FEEDBACK_TYPE,
  FEEDBACK_TYPES,
  createFeedbackForm,
  getFeedbackTypeOptions,
  validateFeedbackInput,
  createFeedbackRecord,
  readFeedback,
  writeFeedback,
  submitFeedback,
  clearFeedback,
  getFeedbackSummary
};
