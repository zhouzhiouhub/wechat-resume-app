const localResumeDataService = require('./localResumeDataService');
const resumeMapper = require('../modules/resume/resumeMapper');

function getResume(wxApi) {
  const resumeData = localResumeDataService.readResumeData(wxApi);

  return resumeMapper.mapResumeData(resumeData);
}

function getProfile(wxApi) {
  return getResume(wxApi).profile;
}

function getSkillGroups(wxApi) {
  return getResume(wxApi).skillGroups;
}

function getProjects(wxApi) {
  return getResume(wxApi).projects;
}

function getTimeline(wxApi) {
  return getResume(wxApi).timeline;
}

function getProjectById(projectId, wxApi) {
  if (typeof projectId !== 'string' || projectId.trim().length === 0) {
    return null;
  }

  return getProjects(wxApi).find((project) => project.id === projectId.trim()) || null;
}

function getHomeResume(wxApi) {
  const resume = getResume(wxApi);

  return {
    profile: resume.profile,
    contact: resume.profile.contact,
    skillGroups: resume.skillGroups,
    skillHighlights: resumeMapper.getSkillHighlights(resume.skillGroups, 5),
    featuredProjects: resumeMapper.getFeaturedProjects(resume.projects, 3),
    timeline: resume.timeline
  };
}

module.exports = {
  getResume,
  getProfile,
  getSkillGroups,
  getProjects,
  getTimeline,
  getProjectById,
  getHomeResume
};
