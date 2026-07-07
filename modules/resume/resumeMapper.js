const validator = require('../../utils/validator');
const dateUtils = require('../../utils/date');
const {
  PROFILE_REQUIRED_FIELDS,
  PROJECT_REQUIRED_FIELDS,
  CHALLENGE_REQUIRED_FIELDS,
  TIMELINE_REQUIRED_FIELDS
} = require('./resumeModel');

function createError(path, message) {
  return new Error(`${path}: ${message}`);
}

function assertPlainObject(value, path) {
  if (!validator.isPlainObject(value)) {
    throw createError(path, 'must be an object');
  }
}

function assertNonEmptyString(value, path) {
  if (!validator.isNonEmptyString(value)) {
    throw createError(path, 'must be a non-empty string');
  }
}

function normalizeOptionalString(value) {
  if (!validator.isOptionalString(value)) {
    return '';
  }

  return value ? value.trim() : '';
}

const CONTACT_LINK_TYPE_LABELS = {
  code: '代码主页',
  blog: '个人博客',
  portfolio: '作品集',
  social: '社交账号',
  certificate: '证书',
  other: '其他'
};

const CONTACT_LINK_VALUE_TYPE_LABELS = {
  url: '链接',
  text: '文本'
};

function normalizeStringArray(value, path, options) {
  if (!validator.isStringArray(value, options)) {
    throw createError(path, 'must be an array of non-empty strings');
  }

  return value.map((item) => item.trim());
}

function getInitials(name) {
  return name.trim().slice(0, 1).toUpperCase();
}

function normalizeContact(contact) {
  assertPlainObject(contact, 'profile.contact');

  if (!validator.isValidEmail(contact.email)) {
    throw createError('profile.contact.email', 'must be a valid email');
  }

  return {
    email: contact.email.trim(),
    phone: normalizeOptionalString(contact.phone),
    wechatQr: normalizeOptionalString(contact.wechatQr),
    links: normalizeContactLinks(contact.links)
  };
}

function normalizeContactLink(link, index) {
  const path = `profile.contact.links[${index}]`;
  assertPlainObject(link, path);
  assertNonEmptyString(link.name, `${path}.name`);
  assertNonEmptyString(link.value, `${path}.value`);

  const type = CONTACT_LINK_TYPE_LABELS[link.type] ? link.type : 'other';
  const valueType = CONTACT_LINK_VALUE_TYPE_LABELS[link.valueType] ? link.valueType : 'text';

  return {
    type,
    typeLabel: CONTACT_LINK_TYPE_LABELS[type],
    name: link.name.trim(),
    valueType,
    valueTypeLabel: CONTACT_LINK_VALUE_TYPE_LABELS[valueType],
    value: link.value.trim(),
    isUrl: valueType === 'url',
    actionLabel: valueType === 'url' ? '复制链接' : '复制内容'
  };
}

function normalizeContactLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links.map(normalizeContactLink);
}

function normalizeProfile(profile) {
  assertPlainObject(profile, 'profile');

  PROFILE_REQUIRED_FIELDS.forEach((field) => {
    assertNonEmptyString(profile[field], `profile.${field}`);
  });

  const name = profile.name.trim();

  return {
    name,
    initials: getInitials(name),
    avatar: normalizeOptionalString(profile.avatar),
    title: profile.title.trim(),
    status: profile.status.trim(),
    summary: profile.summary.trim(),
    location: normalizeOptionalString(profile.location),
    contact: normalizeContact(profile.contact)
  };
}

function normalizeSkill(skill, groupPath, index) {
  const path = `${groupPath}.skills[${index}]`;
  assertPlainObject(skill, path);
  assertNonEmptyString(skill.name, `${path}.name`);

  if (!validator.isValidSkillLevel(skill.level)) {
    throw createError(`${path}.level`, 'must be a number between 0 and 100');
  }

  const tags = normalizeStringArray(skill.tags || [], `${path}.tags`, { allowEmpty: true });

  return {
    name: skill.name.trim(),
    level: skill.level,
    tags,
    tagText: tags.join(' / ')
  };
}

function normalizeSkillGroups(skillGroups) {
  if (!Array.isArray(skillGroups) || skillGroups.length === 0) {
    throw createError('skillGroups', 'must contain at least one skill group');
  }

  return skillGroups.map((group, groupIndex) => {
    const path = `skillGroups[${groupIndex}]`;
    assertPlainObject(group, path);
    assertNonEmptyString(group.groupName, `${path}.groupName`);

    if (!Array.isArray(group.skills) || group.skills.length === 0) {
      throw createError(`${path}.skills`, 'must contain at least one skill');
    }

    return {
      groupName: group.groupName.trim(),
      skills: group.skills.map((skill, skillIndex) => normalizeSkill(skill, path, skillIndex))
    };
  });
}

function normalizeChallenge(challenge, projectPath, index) {
  const path = `${projectPath}.challenges[${index}]`;
  assertPlainObject(challenge, path);

  CHALLENGE_REQUIRED_FIELDS.forEach((field) => {
    assertNonEmptyString(challenge[field], `${path}.${field}`);
  });

  return {
    problem: challenge.problem.trim(),
    solution: challenge.solution.trim(),
    result: challenge.result.trim()
  };
}

function normalizeProject(project, index) {
  const path = `projects[${index}]`;
  assertPlainObject(project, path);

  PROJECT_REQUIRED_FIELDS.forEach((field) => {
    assertNonEmptyString(project[field], `${path}.${field}`);
  });

  if (!Array.isArray(project.challenges) || project.challenges.length === 0) {
    throw createError(`${path}.challenges`, 'must contain at least one challenge');
  }

  const cover = normalizeOptionalString(project.cover);
  const screenshots = normalizeStringArray(project.screenshots || [], `${path}.screenshots`, { allowEmpty: true });
  const highlights = normalizeStringArray(project.highlights, `${path}.highlights`);
  const metrics = normalizeStringArray(project.metrics, `${path}.metrics`);

  return {
    id: project.id.trim(),
    name: project.name.trim(),
    role: project.role.trim(),
    cover,
    screenshots,
    gallery: screenshots.length > 0 ? screenshots : [cover].filter(Boolean),
    techStack: normalizeStringArray(project.techStack, `${path}.techStack`),
    highlights,
    summary: metrics[0] || highlights[0],
    challenges: project.challenges.map((challenge, challengeIndex) => {
      return normalizeChallenge(challenge, path, challengeIndex);
    }),
    metrics
  };
}

function normalizeProjects(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    throw createError('projects', 'must contain at least one project');
  }

  const normalizedProjects = projects.map(normalizeProject);
  const projectIds = normalizedProjects.map((project) => project.id);

  if (!validator.hasUniqueValues(projectIds)) {
    throw createError('projects.id', 'must be unique');
  }

  return normalizedProjects;
}

function getTimelineTypeLabel(type) {
  const typeLabels = {
    work: '工作',
    education: '教育',
    internship: '实习',
    project: '项目'
  };

  return typeLabels[type] || '经历';
}

function normalizeTimelineItem(item, index) {
  const path = `timeline[${index}]`;
  assertPlainObject(item, path);

  TIMELINE_REQUIRED_FIELDS.forEach((field) => {
    assertNonEmptyString(item[field], `${path}.${field}`);
  });

  if (!validator.isValidYearMonth(item.startDate)) {
    throw createError(`${path}.startDate`, 'must use YYYY-MM format');
  }

  const endDate = normalizeOptionalString(item.endDate);

  if (endDate && !validator.isValidYearMonth(endDate)) {
    throw createError(`${path}.endDate`, 'must use YYYY-MM format');
  }

  return {
    type: item.type.trim(),
    typeLabel: getTimelineTypeLabel(item.type.trim()),
    title: item.title.trim(),
    organization: item.organization.trim(),
    startDate: item.startDate.trim(),
    endDate,
    period: dateUtils.formatYearMonthRange(item.startDate, endDate),
    description: item.description.trim(),
    originalIndex: index
  };
}

function compareTimelineItems(left, right) {
  const currentOrder = 999999;
  const rightEndOrder = dateUtils.getYearMonthOrder(right.endDate, currentOrder);
  const leftEndOrder = dateUtils.getYearMonthOrder(left.endDate, currentOrder);

  if (rightEndOrder !== leftEndOrder) {
    return rightEndOrder - leftEndOrder;
  }

  const startOrderDiff = dateUtils.compareYearMonthDesc(left.startDate, right.startDate);

  if (startOrderDiff !== 0) {
    return startOrderDiff;
  }

  return left.originalIndex - right.originalIndex;
}

function normalizeTimeline(timeline) {
  if (!Array.isArray(timeline)) {
    return [];
  }

  return timeline
    .map(normalizeTimelineItem)
    .sort(compareTimelineItems)
    .map(({ originalIndex, ...item }) => item);
}

function getSkillHighlights(skillGroups, limit) {
  return skillGroups
    .reduce((skills, group) => skills.concat(group.skills), [])
    .sort((left, right) => right.level - left.level)
    .slice(0, limit)
    .map((skill) => ({
      name: skill.name,
      level: skill.level
    }));
}

function getFeaturedProjects(projects, limit) {
  return projects.slice(0, limit).map((project) => ({
    id: project.id,
    name: project.name,
    role: project.role,
    cover: project.cover,
    techStack: project.techStack,
    highlights: project.highlights,
    summary: project.summary
  }));
}

function mapResumeData(data) {
  assertPlainObject(data, 'resumeData');

  return {
    profile: normalizeProfile(data.profile),
    skillGroups: normalizeSkillGroups(data.skillGroups),
    projects: normalizeProjects(data.projects),
    timeline: normalizeTimeline(data.timeline)
  };
}

module.exports = {
  mapResumeData,
  normalizeProfile,
  normalizeSkillGroups,
  normalizeProjects,
  normalizeTimeline,
  getSkillHighlights,
  getFeaturedProjects
};
