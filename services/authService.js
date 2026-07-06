const envConfig = require('../config/env');
const cloudDataService = require('./cloudDataService');

const ADMIN_ACCESS_STORAGE_KEY = 'resume_admin_access';

function getTimestamp(options = {}) {
  return typeof options.now === 'number' && Number.isFinite(options.now)
    ? options.now
    : Date.now();
}

function getAdminConfig(options = {}) {
  return options.envConfig && options.envConfig.admin
    ? options.envConfig.admin
    : envConfig.admin;
}

function createAdminGrant(options = {}) {
  const adminConfig = getAdminConfig(options);
  const grantedAt = getTimestamp(options);
  const ttlMs = adminConfig.localAccessTtlMs || envConfig.admin.localAccessTtlMs;

  return {
    grantedAt,
    expiresAt: grantedAt + ttlMs,
    source: options.source || 'hidden_entry'
  };
}

function saveAdminGrant(wxApi, grant) {
  if (!wxApi || typeof wxApi.setStorageSync !== 'function') {
    return grant;
  }

  try {
    wxApi.setStorageSync(ADMIN_ACCESS_STORAGE_KEY, grant);
  } catch (error) {
    return grant;
  }

  return grant;
}

function grantAdminAccess(wxApi, options = {}) {
  const grant = createAdminGrant(options);

  return saveAdminGrant(wxApi, grant);
}

function readAdminGrant(wxApi) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function') {
    return null;
  }

  try {
    const grant = wxApi.getStorageSync(ADMIN_ACCESS_STORAGE_KEY);

    return grant && typeof grant === 'object' ? grant : null;
  } catch (error) {
    return null;
  }
}

function hasValidLocalGrant(wxApi, options = {}) {
  const grant = readAdminGrant(wxApi);
  const now = getTimestamp(options);

  return Boolean(grant && typeof grant.expiresAt === 'number' && grant.expiresAt > now);
}

function clearAdminAccess(wxApi) {
  if (!wxApi) {
    return;
  }

  try {
    if (typeof wxApi.removeStorageSync === 'function') {
      wxApi.removeStorageSync(ADMIN_ACCESS_STORAGE_KEY);
    }
  } catch (error) {
    return;
  }
}

function getAdminGuardState(wxApi, options = {}) {
  const grant = readAdminGrant(wxApi);
  const isAuthorized = hasValidLocalGrant(wxApi, options);

  return {
    isAuthorized,
    expiresAt: grant && grant.expiresAt ? grant.expiresAt : 0,
    reason: isAuthorized ? '' : '需要通过隐藏入口进入'
  };
}

function createAdminCheckRequest(openId, options = {}) {
  const adminConfig = getAdminConfig(options);

  return {
    openId,
    allowedOpenIds: adminConfig.allowedOpenIds || []
  };
}

function checkCloudAdmin(wxApi, options = {}) {
  return cloudDataService.callResumeCloudFunction(
    wxApi,
    cloudDataService.CLOUD_ACTIONS.CHECK_ADMIN,
    {},
    options
  );
}

module.exports = {
  ADMIN_ACCESS_STORAGE_KEY,
  createAdminGrant,
  grantAdminAccess,
  readAdminGrant,
  hasValidLocalGrant,
  clearAdminAccess,
  getAdminGuardState,
  createAdminCheckRequest,
  checkCloudAdmin
};
