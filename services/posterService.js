const resumeService = require('./resumeService');
const resumeMapper = require('../modules/resume/resumeMapper');
const posterRenderService = require('./posterRenderService');

function createPosterModel(resume) {
  if (!resume || !resume.profile) {
    throw new Error('poster.resume: profile is required');
  }

  const skillTags = resumeMapper.getSkillHighlights(resume.skillGroups || [], 3);
  const projects = resumeMapper.getFeaturedProjects(resume.projects || [], 2);
  const hasWechatQr = Boolean(resume.profile.contact.wechatQr);

  return {
    title: `${resume.profile.name}的个人简历`,
    profile: {
      name: resume.profile.name,
      title: resume.profile.title,
      status: resume.profile.status,
      summary: resume.profile.summary,
      location: resume.profile.location
    },
    skillTags,
    projects,
    contact: {
      email: resume.profile.contact.email,
      phone: resume.profile.contact.phone,
      wechatQr: resume.profile.contact.wechatQr,
      hasWechatQr
    },
    footer: hasWechatQr ? '扫码了解项目与联系方式' : '复制邮箱继续沟通'
  };
}

function getPosterModel() {
  return createPosterModel(resumeService.getResume());
}

function createPosterRenderPlan(posterModel, themeId) {
  return posterRenderService.createPosterRenderPlan(posterModel, themeId);
}

module.exports = {
  createPosterModel,
  getPosterModel,
  createPosterRenderPlan
};
