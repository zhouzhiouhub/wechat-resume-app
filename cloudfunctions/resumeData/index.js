const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const COLLECTIONS = {
  analytics: 'resume_analytics_events',
  feedback: 'resume_feedback_records'
};

function createSuccess(data = {}) {
  return {
    ok: true,
    data
  };
}

function createFailure(message, extra = {}) {
  return {
    ok: false,
    errorMessage: message,
    ...extra
  };
}

function assertObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }
}

function getAdminOpenIds() {
  return (process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function recordAnalytics(data) {
  assertObject(data.event, 'event');

  const result = await db.collection(COLLECTIONS.analytics).add({
    data: {
      ...data.event,
      storedAt: Date.now()
    }
  });

  return createSuccess({
    id: result._id
  });
}

async function submitFeedback(data) {
  assertObject(data.record, 'record');

  const result = await db.collection(COLLECTIONS.feedback).add({
    data: {
      ...data.record,
      storedAt: Date.now()
    }
  });

  return createSuccess({
    id: result._id
  });
}

async function sendNotification(data) {
  assertObject(data.notification, 'notification');

  const notification = data.notification;

  if (!notification.templateId || !notification.toUser) {
    return createFailure('notification templateId and toUser are required', {
      skipped: true
    });
  }

  const result = await cloud.openapi.subscribeMessage.send({
    touser: notification.toUser,
    templateId: notification.templateId,
    page: notification.page,
    data: notification.data,
    miniprogramState: notification.miniprogramState || 'developer'
  });

  return createSuccess(result);
}

async function getOpenId() {
  const context = cloud.getWXContext();

  return createSuccess({
    openId: context.OPENID
  });
}

async function checkAdmin() {
  const context = cloud.getWXContext();
  const allowedOpenIds = getAdminOpenIds();

  return createSuccess({
    isAdmin: allowedOpenIds.indexOf(context.OPENID) !== -1,
    openId: context.OPENID
  });
}

exports.main = async (event = {}) => {
  const action = event.action;
  const data = event.data || {};

  try {
    if (action === 'recordAnalytics') {
      return recordAnalytics(data);
    }

    if (action === 'submitFeedback') {
      return submitFeedback(data);
    }

    if (action === 'sendNotification') {
      return sendNotification(data);
    }

    if (action === 'getOpenId') {
      return getOpenId();
    }

    if (action === 'checkAdmin') {
      return checkAdmin();
    }

    return createFailure(`Unknown action: ${action || ''}`);
  } catch (error) {
    return createFailure(error && error.message ? error.message : 'cloudfunction failed');
  }
};
