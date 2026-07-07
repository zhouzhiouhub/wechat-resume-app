const validator = require('../utils/validator');

const STORAGE_KEY = 'resume_preferences';

const PROFILE_FIELDS = {
  NAME: 'name',
  TITLE: 'title',
  STATUS: 'status',
  SUMMARY: 'summary',
  LOCATION: 'location',
  EMAIL: 'email',
  PHONE: 'phone'
};

const DISPLAY_FIELDS = {
  INITIAL_SECTION: 'initialSection',
  FEATURED_PROJECT_COUNT: 'featuredProjectCount',
  SHOW_POSTER: 'showPoster',
  SHOW_PRINT: 'showPrint',
  SHOW_FEEDBACK: 'showFeedback',
  SHOW_CUSTOMER_SERVICE: 'showCustomerService'
};

const DISPLAY_DEFAULTS = {
  initialSection: 'all',
  featuredProjectCount: 3,
  showPoster: true,
  showPrint: true,
  showFeedback: true,
  showCustomerService: true
};

const SECTION_OPTIONS = [
  { id: 'all', label: '全部' },
  { id: 'profile', label: '名片' },
  { id: 'skills', label: '技能' },
  { id: 'projects', label: '项目' },
  { id: 'timeline', label: '履历' },
  { id: 'contact', label: '联系' },
  { id: 'tools', label: '工具' }
];

const DISPLAY_SWITCH_DEFINITIONS = [
  {
    field: DISPLAY_FIELDS.SHOW_POSTER,
    label: '分享海报'
  },
  {
    field: DISPLAY_FIELDS.SHOW_PRINT,
    label: '打印版'
  },
  {
    field: DISPLAY_FIELDS.SHOW_FEEDBACK,
    label: '留言反馈'
  },
  {
    field: DISPLAY_FIELDS.SHOW_CUSTOMER_SERVICE,
    label: '客服预留'
  }
];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeFeaturedProjectCount(value) {
  const count = Number(value);

  if (!Number.isFinite(count)) {
    return DISPLAY_DEFAULTS.featuredProjectCount;
  }

  return Math.min(Math.max(Math.round(count), 1), 5);
}

function normalizeInitialSection(sectionId) {
  const normalizedId = normalizeText(sectionId);

  return SECTION_OPTIONS.some((option) => option.id === normalizedId)
    ? normalizedId
    : DISPLAY_DEFAULTS.initialSection;
}

function getInitials(name) {
  return normalizeText(name).slice(0, 1).toUpperCase();
}

function normalizeProfilePreferences(profile = {}) {
  return {
    name: normalizeText(profile.name),
    title: normalizeText(profile.title),
    status: normalizeText(profile.status),
    summary: normalizeText(profile.summary),
    location: normalizeText(profile.location),
    email: normalizeText(profile.email),
    phone: normalizeText(profile.phone)
  };
}

function normalizeDisplayPreferences(display = {}) {
  return {
    initialSection: normalizeInitialSection(display.initialSection),
    featuredProjectCount: normalizeFeaturedProjectCount(display.featuredProjectCount),
    showPoster: normalizeBoolean(display.showPoster, DISPLAY_DEFAULTS.showPoster),
    showPrint: normalizeBoolean(display.showPrint, DISPLAY_DEFAULTS.showPrint),
    showFeedback: normalizeBoolean(display.showFeedback, DISPLAY_DEFAULTS.showFeedback),
    showCustomerService: normalizeBoolean(
      display.showCustomerService,
      DISPLAY_DEFAULTS.showCustomerService
    )
  };
}

function normalizeResumePreferences(preferences = {}) {
  return {
    profile: normalizeProfilePreferences(preferences.profile),
    display: normalizeDisplayPreferences(preferences.display)
  };
}

function readResumePreferences(wxApi) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function') {
    return normalizeResumePreferences();
  }

  try {
    return normalizeResumePreferences(wxApi.getStorageSync(STORAGE_KEY));
  } catch (error) {
    return normalizeResumePreferences();
  }
}

function validateResumePreferences(preferences) {
  const normalizedPreferences = normalizeResumePreferences(preferences);
  const profile = normalizedPreferences.profile;
  const errors = [];

  [
    { field: PROFILE_FIELDS.NAME, label: '姓名', maxLength: 24 },
    { field: PROFILE_FIELDS.TITLE, label: '职位', maxLength: 60 },
    { field: PROFILE_FIELDS.STATUS, label: '状态', maxLength: 36 },
    { field: PROFILE_FIELDS.SUMMARY, label: '简介', maxLength: 180 }
  ].forEach((rule) => {
    const value = profile[rule.field];

    if (!validator.isNonEmptyString(value)) {
      errors.push(`${rule.label}不能为空`);
      return;
    }

    if (value.length > rule.maxLength) {
      errors.push(`${rule.label}过长`);
    }
  });

  if (profile.location.length > 36) {
    errors.push('城市过长');
  }

  if (!validator.isValidEmail(profile.email)) {
    errors.push('邮箱格式不正确');
  }

  if (profile.phone.length > 30) {
    errors.push('手机号过长');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: normalizedPreferences
  };
}

function saveResumePreferences(wxApi, preferences) {
  const validation = validateResumePreferences(preferences);

  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  if (wxApi && typeof wxApi.setStorageSync === 'function') {
    wxApi.setStorageSync(STORAGE_KEY, validation.value);
  }

  return validation.value;
}

function clearResumePreferences(wxApi) {
  if (wxApi && typeof wxApi.removeStorageSync === 'function') {
    wxApi.removeStorageSync(STORAGE_KEY);
  }

  return normalizeResumePreferences();
}

function applyPreferencesToProfile(profile, preferences) {
  const normalizedPreferences = normalizeResumePreferences(preferences);
  const profilePreferences = normalizedPreferences.profile;
  const contact = profile.contact || {};
  const name = profilePreferences.name || profile.name;
  const email = validator.isValidEmail(profilePreferences.email)
    ? profilePreferences.email
    : contact.email;
  const phone = profilePreferences.phone || contact.phone || '';

  return {
    ...profile,
    name,
    initials: getInitials(name),
    title: profilePreferences.title || profile.title,
    status: profilePreferences.status || profile.status,
    summary: profilePreferences.summary || profile.summary,
    location: profilePreferences.location || profile.location,
    contact: {
      ...contact,
      email,
      phone
    }
  };
}

function applyPreferencesToResume(resume, preferences) {
  return {
    ...resume,
    profile: applyPreferencesToProfile(resume.profile, preferences)
  };
}

function createProfileDraft(profile) {
  const contact = profile.contact || {};

  return normalizeProfilePreferences({
    name: profile.name,
    title: profile.title,
    status: profile.status,
    summary: profile.summary,
    location: profile.location,
    email: contact.email,
    phone: contact.phone
  });
}

function createDisplaySwitches(displayDraft) {
  return DISPLAY_SWITCH_DEFINITIONS.map((item) => ({
    ...item,
    checked: Boolean(displayDraft[item.field])
  }));
}

function createSectionOptions(activeSectionId) {
  return SECTION_OPTIONS.map((option) => ({
    ...option,
    isActive: option.id === activeSectionId
  }));
}

function createPreferenceStateFromDraft(profileDraft, displayDraft) {
  const normalizedProfileDraft = normalizeProfilePreferences(profileDraft);
  const normalizedDisplayDraft = normalizeDisplayPreferences(displayDraft);

  return {
    profileDraft: normalizedProfileDraft,
    displayDraft: normalizedDisplayDraft,
    sectionOptions: createSectionOptions(normalizedDisplayDraft.initialSection),
    displaySwitches: createDisplaySwitches(normalizedDisplayDraft)
  };
}

function createPreferenceState(resume, preferences) {
  const normalizedPreferences = normalizeResumePreferences(preferences);
  const preferredResume = applyPreferencesToResume(resume, normalizedPreferences);

  return createPreferenceStateFromDraft(
    createProfileDraft(preferredResume.profile),
    normalizedPreferences.display
  );
}

function createPreferencesFromState(state = {}) {
  return normalizeResumePreferences({
    profile: state.profileDraft,
    display: state.displayDraft
  });
}

module.exports = {
  STORAGE_KEY,
  PROFILE_FIELDS,
  DISPLAY_FIELDS,
  DISPLAY_DEFAULTS,
  normalizeResumePreferences,
  normalizeDisplayPreferences,
  readResumePreferences,
  validateResumePreferences,
  saveResumePreferences,
  clearResumePreferences,
  applyPreferencesToProfile,
  applyPreferencesToResume,
  createPreferenceState,
  createPreferenceStateFromDraft,
  createPreferencesFromState
};
