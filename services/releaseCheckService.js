const defaultEnvConfig = require('../config/env');
const validator = require('../utils/validator');

const REQUIRED_PAGES = [
  'pages/home/home',
  'pages/project-detail/project-detail',
  'pages/poster/poster',
  'pages/print/print',
  'pages/admin-dashboard/admin-dashboard',
  'pages/feedback/feedback'
];

function createCheck(id, status, title, detail) {
  return {
    id,
    status,
    title,
    detail
  };
}

function hasPage(appConfig, pagePath) {
  return Boolean(appConfig && Array.isArray(appConfig.pages) && appConfig.pages.indexOf(pagePath) !== -1);
}

function isPlaceholderEmail(email) {
  return email === 'name@example.com'
    || email === 'example@example.com'
    || email === 'user@example.com';
}

function getProjectImages(resume) {
  const projects = resume && Array.isArray(resume.projects) ? resume.projects : [];

  return projects.reduce((images, project) => {
    if (project.cover) {
      images.push(project.cover);
    }

    if (Array.isArray(project.gallery)) {
      return images.concat(project.gallery);
    }

    return images;
  }, []);
}

function createPageChecks(appConfig) {
  return REQUIRED_PAGES.map((pagePath) => createCheck(
    `page:${pagePath}`,
    hasPage(appConfig, pagePath) ? 'pass' : 'fail',
    `页面注册：${pagePath}`,
    hasPage(appConfig, pagePath) ? '已注册' : '未在 app.json 注册'
  ));
}

function createResumeChecks(resume) {
  const profile = resume && resume.profile ? resume.profile : {};
  const contact = profile.contact || {};
  const projects = resume && Array.isArray(resume.projects) ? resume.projects : [];
  const images = getProjectImages(resume);

  return [
    createCheck(
      'resume:profile',
      profile.name && profile.title && profile.status ? 'pass' : 'fail',
      '首屏身份信息',
      '姓名、岗位和状态需要完整'
    ),
    createCheck(
      'resume:email',
      validator.isValidEmail(contact.email) && !isPlaceholderEmail(contact.email) ? 'pass' : 'warn',
      '联系邮箱',
      isPlaceholderEmail(contact.email) ? '仍是占位邮箱' : '邮箱格式可用'
    ),
    createCheck(
      'resume:wechatQr',
      contact.wechatQr ? 'pass' : 'warn',
      '微信二维码',
      contact.wechatQr ? '已配置二维码' : '二维码待补充'
    ),
    createCheck(
      'resume:avatar',
      profile.avatar ? 'pass' : 'warn',
      '头像素材',
      profile.avatar ? '已配置头像' : '当前使用姓名首字兜底'
    ),
    createCheck(
      'resume:projects',
      projects.length >= 2 ? 'pass' : 'fail',
      '项目数量',
      `当前 ${projects.length} 个项目`
    ),
    createCheck(
      'resume:images',
      images.length >= projects.length ? 'pass' : 'warn',
      '项目图片',
      `当前 ${images.length} 张项目图`
    )
  ];
}

function createProjectConfigChecks(projectConfig) {
  const setting = projectConfig && projectConfig.setting ? projectConfig.setting : {};

  return [
    createCheck(
      'project:minified',
      setting.minified && setting.minifyWXML ? 'pass' : 'warn',
      '构建压缩',
      '建议开启 JS/WXML 压缩'
    ),
    createCheck(
      'project:cloudRoot',
      projectConfig && projectConfig.cloudfunctionRoot ? 'pass' : 'warn',
      '云函数目录',
      projectConfig && projectConfig.cloudfunctionRoot ? projectConfig.cloudfunctionRoot : '未配置 cloudfunctionRoot'
    )
  ];
}

function createCloudChecks(envConfig = defaultEnvConfig) {
  const cloud = envConfig.cloud || {};
  const subscription = envConfig.subscription || {};

  return [
    createCheck(
      'cloud:enabled',
      cloud.enabled && cloud.envId ? 'pass' : 'warn',
      '云开发开关',
      cloud.enabled ? '已开启云开发' : '默认关闭，发布前需填写 envId 后开启'
    ),
    createCheck(
      'subscription:template',
      subscription.enabled && subscription.projectBrowseTemplateId ? 'pass' : 'warn',
      '订阅消息模板',
      subscription.enabled ? '已配置模板' : '默认关闭，发布前按需配置模板 ID'
    )
  ];
}

function summarizeChecks(checks) {
  return checks.reduce((summary, check) => {
    summary.total += 1;
    summary[check.status] += 1;
    return summary;
  }, {
    total: 0,
    pass: 0,
    warn: 0,
    fail: 0
  });
}

function createReleaseChecklist(input = {}) {
  const checks = []
    .concat(createPageChecks(input.appConfig || {}))
    .concat(createResumeChecks(input.resume || {}))
    .concat(createProjectConfigChecks(input.projectConfig || {}))
    .concat(createCloudChecks(input.envConfig || defaultEnvConfig));

  return {
    checks,
    summary: summarizeChecks(checks),
    isReleaseBlocked: checks.some((check) => check.status === 'fail')
  };
}

module.exports = {
  REQUIRED_PAGES,
  createReleaseChecklist,
  summarizeChecks
};
