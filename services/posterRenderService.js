const themeUtils = require('../utils/theme');

const POSTER_CANVAS = {
  width: 750,
  height: 1200,
  exportScale: 2,
  fileType: 'png',
  quality: 1
};

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function truncateText(value, maxLength) {
  const text = normalizeText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(maxLength - 1, 0))}...`;
}

function createTextLines(value, maxChars, maxLines) {
  const text = normalizeText(value);
  const lines = [];

  if (!text) {
    return lines;
  }

  for (let index = 0; index < text.length && lines.length < maxLines; index += maxChars) {
    lines.push(text.slice(index, index + maxChars));
  }

  if (lines.length === maxLines && text.length > maxChars * maxLines) {
    lines[maxLines - 1] = truncateText(lines[maxLines - 1], Math.max(maxChars - 1, 1));
  }

  return lines;
}

function getTextBoxWidth(text, fontSize, horizontalPadding, maxWidth) {
  const estimatedWidth = normalizeText(text).length * fontSize * 0.62 + horizontalPadding * 2;

  return Math.min(Math.ceil(estimatedWidth), maxWidth);
}

function addText(commands, options) {
  commands.push({
    type: 'text',
    text: normalizeText(options.text),
    x: options.x,
    y: options.y,
    color: options.color,
    fontSize: options.fontSize,
    fontWeight: options.fontWeight || 'normal',
    align: options.align || 'left',
    maxWidth: options.maxWidth || 0
  });
}

function addWrappedText(commands, text, x, y, options) {
  const lines = createTextLines(text, options.maxChars, options.maxLines);
  let nextY = y;

  lines.forEach((line) => {
    addText(commands, {
      text: line,
      x,
      y: nextY,
      color: options.color,
      fontSize: options.fontSize,
      fontWeight: options.fontWeight,
      align: options.align,
      maxWidth: options.maxWidth
    });

    nextY += options.lineHeight;
  });

  return nextY;
}

function addRoundRect(commands, options) {
  commands.push({
    type: 'roundRect',
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    radius: options.radius || 0,
    fillColor: options.fillColor,
    strokeColor: options.strokeColor || '',
    lineWidth: options.lineWidth || 0
  });
}

function createPalette(themeId) {
  const variables = themeUtils.getThemeVariables(themeId);

  return {
    background: variables['--resume-bg'],
    surface: variables['--resume-surface'],
    surfaceHover: variables['--resume-surface-hover'],
    text: variables['--resume-text'],
    muted: variables['--resume-muted'],
    subtle: variables['--resume-subtle'],
    border: variables['--resume-border'],
    accent: variables['--resume-accent'],
    accentSoft: variables['--resume-accent-soft'],
    accentText: variables['--resume-accent-text'],
    success: variables['--resume-success'],
    successSoft: variables['--resume-success-soft']
  };
}

function createPosterRenderPlan(posterModel, themeId) {
  if (!posterModel || !posterModel.profile || !posterModel.contact) {
    throw new Error('poster.renderPlan: poster model is required');
  }

  const palette = createPalette(themeId);
  const commands = [];
  const cardX = 40;
  const cardY = 40;
  const cardWidth = 670;
  const contentX = 80;
  const contentWidth = 590;
  let y = 86;

  addRoundRect(commands, {
    x: 0,
    y: 0,
    width: POSTER_CANVAS.width,
    height: POSTER_CANVAS.height,
    fillColor: palette.background
  });

  addRoundRect(commands, {
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: 1088,
    radius: 16,
    fillColor: palette.surface,
    strokeColor: palette.border,
    lineWidth: 2
  });

  const statusText = posterModel.profile.status;
  const statusWidth = getTextBoxWidth(statusText, 24, 18, 260);

  addRoundRect(commands, {
    x: contentX,
    y,
    width: statusWidth,
    height: 44,
    radius: 22,
    fillColor: palette.successSoft
  });
  addText(commands, {
    text: statusText,
    x: contentX + 18,
    y: y + 8,
    color: palette.success,
    fontSize: 24,
    fontWeight: 'bold'
  });

  y += 68;
  addText(commands, {
    text: posterModel.profile.name,
    x: contentX,
    y,
    color: palette.text,
    fontSize: 54,
    fontWeight: 'bold',
    maxWidth: contentWidth
  });

  y += 72;
  addText(commands, {
    text: posterModel.profile.title,
    x: contentX,
    y,
    color: palette.text,
    fontSize: 32,
    fontWeight: 'bold',
    maxWidth: contentWidth
  });

  y += 52;
  y = addWrappedText(commands, posterModel.profile.summary, contentX, y, {
    color: palette.muted,
    fontSize: 26,
    lineHeight: 38,
    maxChars: 22,
    maxLines: 2,
    maxWidth: contentWidth
  });

  y += 32;
  addRoundRect(commands, {
    x: contentX,
    y,
    width: contentWidth,
    height: 2,
    fillColor: palette.border
  });

  y += 36;
  addText(commands, {
    text: '核心技能',
    x: contentX,
    y,
    color: palette.text,
    fontSize: 32,
    fontWeight: 'bold'
  });

  y += 50;
  let chipX = contentX;
  let chipY = y;
  const chipHeight = 50;

  posterModel.skillTags.forEach((skill) => {
    const chipText = `${skill.name} ${skill.level}%`;
    const chipWidth = getTextBoxWidth(chipText, 24, 20, 250);

    if (chipX + chipWidth > contentX + contentWidth) {
      chipX = contentX;
      chipY += chipHeight + 12;
    }

    addRoundRect(commands, {
      x: chipX,
      y: chipY,
      width: chipWidth,
      height: chipHeight,
      radius: 8,
      fillColor: palette.accentSoft
    });
    addText(commands, {
      text: chipText,
      x: chipX + 20,
      y: chipY + 12,
      color: palette.accentText,
      fontSize: 24,
      fontWeight: 'bold'
    });

    chipX += chipWidth + 12;
  });

  y = chipY + chipHeight + 42;
  addText(commands, {
    text: '代表项目',
    x: contentX,
    y,
    color: palette.text,
    fontSize: 32,
    fontWeight: 'bold'
  });

  y += 48;
  posterModel.projects.forEach((project) => {
    addRoundRect(commands, {
      x: contentX,
      y,
      width: contentWidth,
      height: 138,
      radius: 12,
      fillColor: palette.surfaceHover,
      strokeColor: palette.border,
      lineWidth: 1
    });
    addText(commands, {
      text: truncateText(project.name, 18),
      x: contentX + 24,
      y: y + 22,
      color: palette.text,
      fontSize: 28,
      fontWeight: 'bold',
      maxWidth: contentWidth - 48
    });
    addWrappedText(commands, project.summary, contentX + 24, y + 64, {
      color: palette.muted,
      fontSize: 24,
      lineHeight: 32,
      maxChars: 24,
      maxLines: 2,
      maxWidth: contentWidth - 48
    });

    y += 158;
  });

  y = Math.max(y + 14, 878);
  addRoundRect(commands, {
    x: contentX,
    y,
    width: contentWidth,
    height: 2,
    fillColor: palette.border
  });

  y += 34;
  addText(commands, {
    text: '联系邮箱',
    x: contentX,
    y,
    color: palette.subtle,
    fontSize: 24
  });
  addText(commands, {
    text: posterModel.contact.email,
    x: contentX,
    y: y + 38,
    color: palette.text,
    fontSize: 28,
    fontWeight: 'bold',
    maxWidth: 420
  });

  if (posterModel.contact.phone) {
    addText(commands, {
      text: posterModel.contact.phone,
      x: contentX,
      y: y + 76,
      color: palette.muted,
      fontSize: 24,
      fontWeight: 'bold',
      maxWidth: 420
    });
  }

  const firstLink = posterModel.contact.links && posterModel.contact.links[0];

  if (firstLink) {
    addText(commands, {
      text: `${firstLink.name}: ${truncateText(firstLink.value, 28)}`,
      x: contentX,
      y: y + 110,
      color: palette.muted,
      fontSize: 22,
      maxWidth: 420
    });
  }

  addRoundRect(commands, {
    x: 552,
    y: y - 6,
    width: 112,
    height: 112,
    radius: 10,
    fillColor: palette.accentSoft
  });

  if (posterModel.contact.hasWechatQr) {
    commands.push({
      type: 'image',
      src: posterModel.contact.wechatQr,
      x: 562,
      y: y + 4,
      width: 92,
      height: 92
    });
  } else {
    addWrappedText(commands, '二维码待补充', 608, y + 25, {
      color: palette.accent,
      fontSize: 20,
      lineHeight: 26,
      maxChars: 3,
      maxLines: 2,
      maxWidth: 96,
      fontWeight: 'bold'
    });
  }

  addText(commands, {
    text: posterModel.footer,
    x: POSTER_CANVAS.width / 2,
    y: 1072,
    color: palette.subtle,
    fontSize: 24,
    align: 'center',
    maxWidth: contentWidth
  });

  return {
    canvas: { ...POSTER_CANVAS },
    palette,
    commands,
    sections: [
      { id: 'profile', required: true, source: posterModel.profile },
      { id: 'skills', required: true, source: posterModel.skillTags },
      { id: 'projects', required: true, source: posterModel.projects },
      { id: 'contact', required: true, source: posterModel.contact }
    ]
  };
}

module.exports = {
  createPosterRenderPlan
};
