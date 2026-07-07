const defaultResumeData = require('../modules/resume/resumeData');
const resumeMapper = require('../modules/resume/resumeMapper');

const STORAGE_KEY = 'resume_local_data';
const DATA_VERSION = 1;

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function getTimestamp(options = {}) {
  return typeof options.now === 'number' && Number.isFinite(options.now)
    ? options.now
    : Date.now();
}

function hasStorageApi(wxApi) {
  return Boolean(
    wxApi
    && typeof wxApi.getStorageSync === 'function'
    && typeof wxApi.setStorageSync === 'function'
  );
}

function getDefaultResumeData(options = {}) {
  return cloneData(options.defaultResumeData || defaultResumeData);
}

function validateResumeData(resumeData) {
  resumeMapper.mapResumeData(resumeData);

  return cloneData(resumeData);
}

function normalizeStoredPayload(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (value.resumeData && typeof value.resumeData === 'object') {
    return {
      version: value.version || DATA_VERSION,
      resumeData: value.resumeData,
      updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0
    };
  }

  if (value.profile && value.skillGroups && value.projects) {
    return {
      version: DATA_VERSION,
      resumeData: value,
      updatedAt: 0
    };
  }

  return null;
}

function readStoredPayload(wxApi) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function') {
    return null;
  }

  try {
    const payload = normalizeStoredPayload(wxApi.getStorageSync(STORAGE_KEY));

    if (!payload) {
      return null;
    }

    return {
      ...payload,
      resumeData: validateResumeData(payload.resumeData)
    };
  } catch (error) {
    return null;
  }
}

function readResumeData(wxApi, options = {}) {
  const payload = readStoredPayload(wxApi);

  return payload ? payload.resumeData : getDefaultResumeData(options);
}

function formatUpdatedAt(timestamp) {
  if (!timestamp) {
    return '使用模板';
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '已保存';
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}-${day} ${hour}:${minute}`;
}

function formatResumeDataJson(resumeData) {
  return JSON.stringify(validateResumeData(resumeData), null, 2);
}

function createResumeDataState(resumeData, meta = {}) {
  const safeResumeData = resumeData ? validateResumeData(resumeData) : getDefaultResumeData();
  const updatedAt = meta.updatedAt || 0;

  return {
    jsonText: formatResumeDataJson(safeResumeData),
    hasLocalData: Boolean(meta.hasLocalData),
    updatedAt,
    statusText: meta.hasLocalData ? `已保存 ${formatUpdatedAt(updatedAt)}` : '使用模板'
  };
}

function readResumeDataState(wxApi, options = {}) {
  const payload = readStoredPayload(wxApi);
  const resumeData = payload ? payload.resumeData : getDefaultResumeData(options);

  return createResumeDataState(resumeData, {
    hasLocalData: Boolean(payload),
    updatedAt: payload ? payload.updatedAt : 0
  });
}

function parseResumeDataJson(jsonText) {
  if (typeof jsonText !== 'string' || !jsonText.trim()) {
    throw new Error('完整简历数据不能为空');
  }

  try {
    return validateResumeData(JSON.parse(jsonText));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('完整简历数据不是有效 JSON');
    }

    throw error;
  }
}

function createStoredPayload(resumeData, options = {}) {
  return {
    version: DATA_VERSION,
    resumeData: validateResumeData(resumeData),
    updatedAt: getTimestamp(options)
  };
}

function saveResumeData(wxApi, resumeData, options = {}) {
  const payload = createStoredPayload(resumeData, options);

  if (hasStorageApi(wxApi)) {
    wxApi.setStorageSync(STORAGE_KEY, payload);
  }

  return payload;
}

function saveResumeDataJson(wxApi, jsonText, options = {}) {
  return saveResumeData(wxApi, parseResumeDataJson(jsonText), options);
}

function clearResumeData(wxApi, options = {}) {
  if (wxApi && typeof wxApi.removeStorageSync === 'function') {
    wxApi.removeStorageSync(STORAGE_KEY);
  }

  return getDefaultResumeData(options);
}

function applyProfileDraftToResumeData(resumeData, profileDraft = {}) {
  const nextData = validateResumeData(resumeData);
  const profile = nextData.profile;
  const contact = profile.contact || {};

  nextData.profile = {
    ...profile,
    name: profileDraft.name || profile.name,
    title: profileDraft.title || profile.title,
    status: profileDraft.status || profile.status,
    summary: profileDraft.summary || profile.summary,
    location: profileDraft.location || profile.location,
    contact: {
      ...contact,
      email: profileDraft.email || contact.email
    }
  };

  return validateResumeData(nextData);
}

module.exports = {
  STORAGE_KEY,
  DATA_VERSION,
  getDefaultResumeData,
  validateResumeData,
  readResumeData,
  readResumeDataState,
  formatResumeDataJson,
  createResumeDataState,
  parseResumeDataJson,
  saveResumeData,
  saveResumeDataJson,
  clearResumeData,
  applyProfileDraftToResumeData
};
