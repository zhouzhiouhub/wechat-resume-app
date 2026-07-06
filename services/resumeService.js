const resumeData = require('../modules/resume/resumeData');
const resumeMapper = require('../modules/resume/resumeMapper');

function getResume() {
  return resumeMapper.mapResumeData(resumeData);
}

function getProfile() {
  return getResume().profile;
}

function getSkillGroups() {
  return getResume().skillGroups;
}

function getProjects() {
  return getResume().projects;
}

function getProjectById(projectId) {
  if (typeof projectId !== 'string' || projectId.trim().length === 0) {
    return null;
  }

  return getProjects().find((project) => project.id === projectId.trim()) || null;
}

function getHomeResume() {
  const resume = getResume();

  return {
    profile: resume.profile,
    skillGroups: resume.skillGroups,
    skillHighlights: resumeMapper.getSkillHighlights(resume.skillGroups, 5),
    featuredProjects: resumeMapper.getFeaturedProjects(resume.projects, 3)
  };
}

module.exports = {
  getResume,
  getProfile,
  getSkillGroups,
  getProjects,
  getProjectById,
  getHomeResume
};
