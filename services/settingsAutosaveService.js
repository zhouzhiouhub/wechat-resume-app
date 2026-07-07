const localResumeDataService = require('./localResumeDataService');
const resumePreferenceService = require('./resumePreferenceService');

function syncProfilePreferencesFromResumeData(wxApi, resumeData) {
  const preferences = resumePreferenceService.readResumePreferences(wxApi);
  const profile = resumeData.profile || {};
  const contact = profile.contact || {};

  return resumePreferenceService.saveResumePreferences(wxApi, {
    profile: {
      name: profile.name,
      title: profile.title,
      status: profile.status,
      summary: profile.summary,
      location: profile.location,
      email: contact.email,
      phone: contact.phone
    },
    display: preferences.display
  });
}

function saveProfileSettingsDraft(wxApi, preferenceState, options = {}) {
  const preferences = resumePreferenceService.saveResumePreferences(
    wxApi,
    resumePreferenceService.createPreferencesFromState(preferenceState)
  );
  const nextResumeData = localResumeDataService.applyProfileDraftToResumeData(
    localResumeDataService.readResumeData(wxApi),
    preferences.profile
  );
  const payload = localResumeDataService.saveResumeData(wxApi, nextResumeData, options);

  return {
    preferences,
    payload
  };
}

function saveResumeContentDraft(wxApi, resumeDataState, options = {}) {
  const payload = localResumeDataService.saveResumeData(
    wxApi,
    resumeDataState && resumeDataState.draft,
    options
  );
  const preferences = syncProfilePreferencesFromResumeData(wxApi, payload.resumeData);

  return {
    preferences,
    payload
  };
}

module.exports = {
  syncProfilePreferencesFromResumeData,
  saveProfileSettingsDraft,
  saveResumeContentDraft
};
