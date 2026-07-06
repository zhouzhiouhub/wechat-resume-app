const validator = require('../../utils/validator');
const {
  PROFILE_REQUIRED_FIELDS,
  PROJECT_REQUIRED_FIELDS,
  CHALLENGE_REQUIRED_FIELDS
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
    wechatQr: normalizeOptionalString(contact.wechatQr)
  };
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

  return {
    name: skill.name.trim(),
    level: skill.level,
    tags: normalizeStringArray(skill.tags || [], `${path}.tags`, { allowEmpty: true })
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

  const highlights = normalizeStringArray(project.highlights, `${path}.highlights`);
  const metrics = normalizeStringArray(project.metrics, `${path}.metrics`);

  return {
    id: project.id.trim(),
    name: project.name.trim(),
    role: project.role.trim(),
    cover: normalizeOptionalString(project.cover),
    screenshots: normalizeStringArray(project.screenshots || [], `${path}.screenshots`, { allowEmpty: true }),
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
    summary: project.summary
  }));
}

function mapResumeData(data) {
  assertPlainObject(data, 'resumeData');

  return {
    profile: normalizeProfile(data.profile),
    skillGroups: normalizeSkillGroups(data.skillGroups),
    projects: normalizeProjects(data.projects),
    timeline: Array.isArray(data.timeline) ? data.timeline.slice() : []
  };
}

module.exports = {
  mapResumeData,
  normalizeProfile,
  normalizeSkillGroups,
  normalizeProjects,
  getSkillHighlights,
  getFeaturedProjects
};
