const envConfig = require('../config/env');
const wxPromise = require('../utils/wxPromise');

const CLOUD_ACTIONS = {
  RECORD_ANALYTICS: 'recordAnalytics',
  SUBMIT_FEEDBACK: 'submitFeedback',
  SEND_NOTIFICATION: 'sendNotification',
  GET_OPEN_ID: 'getOpenId',
  CHECK_ADMIN: 'checkAdmin'
};

function getCloudConfig(options = {}) {
  return options.envConfig && options.envConfig.cloud
    ? options.envConfig.cloud
    : envConfig.cloud;
}

function isCloudEnabled(options = {}) {
  const cloudConfig = getCloudConfig(options);

  return Boolean(
    cloudConfig
    && cloudConfig.enabled
    && cloudConfig.envId
    && cloudConfig.functionName
  );
}

function hasCloudCall(wxApi) {
  return Boolean(
    wxApi
    && wxApi.cloud
    && typeof wxApi.cloud.callFunction === 'function'
  );
}

function createCloudRequest(action, data = {}, options = {}) {
  return {
    action,
    data,
    meta: {
      appVersion: envConfig.app.version,
      client: 'miniprogram',
      requestedAt: options.now || Date.now()
    }
  };
}

function createSkippedResult(reason) {
  return Promise.resolve({
    ok: false,
    skipped: true,
    reason
  });
}

function callResumeCloudFunction(wxApi, action, data = {}, options = {}) {
  const cloudConfig = getCloudConfig(options);

  if (!isCloudEnabled(options)) {
    return createSkippedResult('cloud_disabled');
  }

  if (!hasCloudCall(wxApi)) {
    return createSkippedResult('cloud_api_unavailable');
  }

  return wxPromise
    .toSafeResult(wxPromise.callWxApi(wxApi.cloud, 'callFunction', {
      name: cloudConfig.functionName,
      data: createCloudRequest(action, data, options)
    }))
    .then((result) => {
      if (!result.ok) {
        return {
          ...result,
          skipped: false
        };
      }

      return {
        ok: true,
        skipped: false,
        result: result.result
      };
    });
}

function syncAnalyticsEvent(wxApi, event, options = {}) {
  return callResumeCloudFunction(
    wxApi,
    CLOUD_ACTIONS.RECORD_ANALYTICS,
    { event },
    options
  );
}

function syncFeedbackRecord(wxApi, record, options = {}) {
  return callResumeCloudFunction(
    wxApi,
    CLOUD_ACTIONS.SUBMIT_FEEDBACK,
    { record },
    options
  );
}

function sendNotification(wxApi, notification, options = {}) {
  return callResumeCloudFunction(
    wxApi,
    CLOUD_ACTIONS.SEND_NOTIFICATION,
    { notification },
    options
  );
}

module.exports = {
  CLOUD_ACTIONS,
  isCloudEnabled,
  createCloudRequest,
  callResumeCloudFunction,
  syncAnalyticsEvent,
  syncFeedbackRecord,
  sendNotification
};
