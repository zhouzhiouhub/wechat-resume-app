const { DEFAULT_THEME_ID, THEMES } = require('../config/theme');
const themeUtils = require('../utils/theme');

const THEME_STORAGE_KEY = 'resume_theme_id';

function getThemeOptions(activeThemeId = DEFAULT_THEME_ID) {
  const normalizedThemeId = themeUtils.normalizeThemeId(activeThemeId);

  return THEMES.map((theme) => ({
    id: theme.id,
    label: theme.label,
    className: theme.className,
    swatchColor: theme.swatchColor,
    isActive: theme.id === normalizedThemeId
  }));
}

function createThemeState(themeId = DEFAULT_THEME_ID) {
  const normalizedThemeId = themeUtils.normalizeThemeId(themeId);
  const theme = themeUtils.getThemeById(normalizedThemeId);

  return {
    activeTheme: theme.id,
    themeClass: theme.className,
    themeOptions: getThemeOptions(theme.id)
  };
}

function loadThemeId(wxApi) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function') {
    return DEFAULT_THEME_ID;
  }

  try {
    return themeUtils.normalizeThemeId(wxApi.getStorageSync(THEME_STORAGE_KEY));
  } catch (error) {
    return DEFAULT_THEME_ID;
  }
}

function saveThemeId(wxApi, themeId) {
  const normalizedThemeId = themeUtils.normalizeThemeId(themeId);

  if (wxApi && typeof wxApi.setStorageSync === 'function') {
    try {
      wxApi.setStorageSync(THEME_STORAGE_KEY, normalizedThemeId);
    } catch (error) {
      return normalizedThemeId;
    }
  }

  return normalizedThemeId;
}

function applyNavigationBar(wxApi, themeId) {
  if (!wxApi || typeof wxApi.setNavigationBarColor !== 'function') {
    return;
  }

  const theme = themeUtils.getThemeById(themeUtils.normalizeThemeId(themeId));

  wxApi.setNavigationBarColor({
    frontColor: theme.navigationBar.textStyle === 'white' ? '#ffffff' : '#000000',
    backgroundColor: theme.navigationBar.backgroundColor
  });
}

module.exports = {
  THEME_STORAGE_KEY,
  getThemeOptions,
  createThemeState,
  loadThemeId,
  saveThemeId,
  applyNavigationBar
};
