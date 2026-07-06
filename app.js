const envConfig = require('./config/env');

function initCloud(wxApi) {
  if (!envConfig.cloud.enabled || !envConfig.cloud.envId) {
    return;
  }

  if (!wxApi || !wxApi.cloud || typeof wxApi.cloud.init !== 'function') {
    return;
  }

  wxApi.cloud.init({
    env: envConfig.cloud.envId,
    traceUser: true
  });
}

App({
  onLaunch() {
    initCloud(wx);
  },

  globalData: {
    appName: 'wechat-resume-app',
    version: envConfig.app.version
  }
});
