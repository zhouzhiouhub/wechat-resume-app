const envConfig = require('../config/env');
const cloudDataService = require('./cloudDataService');

function getSubscriptionConfig(options = {}) {
  return options.envConfig && options.envConfig.subscription
    ? options.envConfig.subscription
    : envConfig.subscription;
}

function isSubscriptionEnabled(options = {}) {
  const subscriptionConfig = getSubscriptionConfig(options);

  return Boolean(
    subscriptionConfig
    && subscriptionConfig.enabled
    && subscriptionConfig.projectBrowseTemplateId
  );
}

function createProjectBrowseNotification(project = {}, options = {}) {
  const subscriptionConfig = getSubscriptionConfig(options);
  const projectName = project.name || project.id || '重点项目';
  const timestamp = options.now || Date.now();

  return {
    type: 'project_browse',
    templateId: subscriptionConfig.projectBrowseTemplateId || '',
    toUser: options.toUser || '',
    page: subscriptionConfig.page || 'pages/admin-dashboard/admin-dashboard',
    miniprogramState: options.miniprogramState || 'developer',
    data: {
      thing1: {
        value: projectName.slice(0, 20)
      },
      thing2: {
        value: (project.role || '项目详情').slice(0, 20)
      },
      date3: {
        value: formatNotificationTime(timestamp)
      }
    }
  };
}

function toTwoDigits(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${toTwoDigits(date.getMonth() + 1)}-${toTwoDigits(date.getDate())} ${toTwoDigits(date.getHours())}:${toTwoDigits(date.getMinutes())}`;
}

function createSkippedResult(reason) {
  return Promise.resolve({
    ok: false,
    skipped: true,
    reason
  });
}

function sendProjectBrowseNotification(wxApi, project, options = {}) {
  if (!isSubscriptionEnabled(options)) {
    return createSkippedResult('subscription_disabled');
  }

  const notification = createProjectBrowseNotification(project, options);

  if (!notification.toUser) {
    return createSkippedResult('notification_receiver_missing');
  }

  return cloudDataService.sendNotification(wxApi, notification, options);
}

module.exports = {
  isSubscriptionEnabled,
  createProjectBrowseNotification,
  sendProjectBrowseNotification
};
