const resumeMapper = require('../modules/resume/resumeMapper');
const resumeService = require('./resumeService');
const resumePreferenceService = require('./resumePreferenceService');
const profileAssetService = require('./profileAssetService');

function getCustomizationContext(wxApi) {
  const baseResume = resumeService.getResume();
  const preferences = resumePreferenceService.readResumePreferences(wxApi);
  const profileAssets = profileAssetService.readProfileAssets(wxApi);
  const displayPreferences = resumePreferenceService.normalizeDisplayPreferences(
    preferences.display
  );
  const preferredResume = resumePreferenceService.applyPreferencesToResume(
    baseResume,
    preferences
  );
  const resume = profileAssetService.applyAssetsToResume(preferredResume, profileAssets);

  return {
    baseResume,
    resume,
    preferences,
    profileAssets,
    displayPreferences
  };
}

function getResume(wxApi) {
  return getCustomizationContext(wxApi).resume;
}

function getHomeResume(wxApi) {
  const context = getCustomizationContext(wxApi);
  const resume = context.resume;

  return {
    ...context,
    profile: resume.profile,
    contact: resume.profile.contact,
    skillGroups: resume.skillGroups,
    skillHighlights: resumeMapper.getSkillHighlights(resume.skillGroups, 5),
    featuredProjects: resumeMapper.getFeaturedProjects(
      resume.projects,
      context.displayPreferences.featuredProjectCount
    ),
    timeline: resume.timeline
  };
}

module.exports = {
  getCustomizationContext,
  getResume,
  getHomeResume
};
