const APP_ENV = {
  app: {
    version: '0.5.0',
    releaseName: 'M5 backend-ready'
  },
  cloud: {
    enabled: false,
    envId: '',
    functionName: 'resumeData',
    collections: {
      analytics: 'resume_analytics_events',
      feedback: 'resume_feedback_records'
    }
  },
  admin: {
    localAccessTtlMs: 15 * 60 * 1000,
    allowedOpenIds: []
  },
  subscription: {
    enabled: false,
    projectBrowseTemplateId: '',
    page: 'pages/admin-dashboard/admin-dashboard'
  },
  release: {
    maxProjectImageBytes: 1024 * 1024
  }
};

module.exports = APP_ENV;
