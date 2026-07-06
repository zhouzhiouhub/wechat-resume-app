const { DEFAULT_THEME_ID, THEMES } = require('../config/theme');

function getThemeById(themeId) {
  return THEMES.find((theme) => theme.id === themeId) || null;
}

function normalizeThemeId(themeId) {
  if (typeof themeId !== 'string') {
    return DEFAULT_THEME_ID;
  }

  return getThemeById(themeId.trim()) ? themeId.trim() : DEFAULT_THEME_ID;
}

function getThemeVariables(themeId) {
  const theme = getThemeById(normalizeThemeId(themeId));

  return { ...theme.variables };
}

function hexToRgb(hexColor) {
  if (typeof hexColor !== 'string') {
    return null;
  }

  const normalizedColor = hexColor.trim().replace('#', '');

  if (!/^[0-9a-fA-F]{6}$/.test(normalizedColor)) {
    return null;
  }

  return {
    red: parseInt(normalizedColor.slice(0, 2), 16),
    green: parseInt(normalizedColor.slice(2, 4), 16),
    blue: parseInt(normalizedColor.slice(4, 6), 16)
  };
}

function getChannelLuminance(channel) {
  const normalizedChannel = channel / 255;

  return normalizedChannel <= 0.03928
    ? normalizedChannel / 12.92
    : Math.pow((normalizedChannel + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hexColor) {
  const rgb = hexToRgb(hexColor);

  if (!rgb) {
    return null;
  }

  return 0.2126 * getChannelLuminance(rgb.red)
    + 0.7152 * getChannelLuminance(rgb.green)
    + 0.0722 * getChannelLuminance(rgb.blue);
}

function getContrastRatio(foregroundColor, backgroundColor) {
  const foregroundLuminance = getRelativeLuminance(foregroundColor);
  const backgroundLuminance = getRelativeLuminance(backgroundColor);

  if (foregroundLuminance === null || backgroundLuminance === null) {
    return 0;
  }

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function hasReadableContrast(foregroundColor, backgroundColor) {
  return getContrastRatio(foregroundColor, backgroundColor) >= 4.5;
}

module.exports = {
  getThemeById,
  normalizeThemeId,
  getThemeVariables,
  getContrastRatio,
  hasReadableContrast
};
