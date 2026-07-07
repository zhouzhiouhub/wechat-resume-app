const localResumeDataService = require('./localResumeDataService');

const LIST_SPLIT_PATTERN = /[\n,，、;；/]+/;

const TIMELINE_TYPES = [
  { id: 'work', label: '工作' },
  { id: 'education', label: '教育' },
  { id: 'internship', label: '实习' },
  { id: 'project', label: '项目' }
];

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseListText(value) {
  return normalizeText(value)
    .split(LIST_SPLIT_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatListText(items) {
  return Array.isArray(items) ? items.join('、') : '';
}

function normalizeSkillLevel(value) {
  const level = Number(value);

  if (!Number.isFinite(level)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(level), 0), 100);
}

function getDraftFromState(state) {
  if (state && state.draft) {
    return cloneData(state.draft);
  }

  if (state && state.resumeData) {
    return cloneData(state.resumeData);
  }

  return localResumeDataService.getDefaultResumeData();
}

function getIndex(value) {
  const index = Number(value);

  return Number.isInteger(index) && index >= 0 ? index : -1;
}

function createViewSkill(skill) {
  return {
    ...skill,
    tagsText: formatListText(skill.tags)
  };
}

function createViewSkillGroup(group) {
  return {
    ...group,
    skills: (group.skills || []).map(createViewSkill)
  };
}

function createViewChallenge(challenge) {
  return {
    problem: challenge.problem || '',
    solution: challenge.solution || '',
    result: challenge.result || ''
  };
}

function createViewProject(project) {
  return {
    ...project,
    techStackText: formatListText(project.techStack),
    highlightsText: formatListText(project.highlights),
    metricsText: formatListText(project.metrics),
    challenges: (project.challenges || []).map(createViewChallenge)
  };
}

function createViewTimelineItem(item) {
  const typeIndex = TIMELINE_TYPES.findIndex((type) => type.id === item.type);

  return {
    ...item,
    typeLabel: typeIndex >= 0 ? TIMELINE_TYPES[typeIndex].label : '经历'
  };
}

function createViewData(draft) {
  return {
    skillGroups: (draft.skillGroups || []).map(createViewSkillGroup),
    projects: (draft.projects || []).map(createViewProject),
    timeline: (draft.timeline || []).map(createViewTimelineItem)
  };
}

function createEditorState(input = {}) {
  const draft = cloneData(input.resumeData || input.draft || localResumeDataService.getDefaultResumeData());

  return {
    draft,
    viewData: createViewData(draft),
    hasLocalData: Boolean(input.hasLocalData),
    updatedAt: input.updatedAt || 0,
    statusText: input.statusText || '使用模板'
  };
}

function withDraft(state, draft) {
  return createEditorState({
    ...state,
    draft
  });
}

function createSkill() {
  return {
    name: '新技能',
    level: 60,
    tags: ['标签']
  };
}

function createSkillGroup() {
  return {
    groupName: '新技能组',
    skills: [createSkill()]
  };
}

function createChallenge() {
  return {
    problem: '问题待填写',
    solution: '方案待填写',
    result: '结果待填写'
  };
}

function createUniqueProjectId(projects) {
  const usedIds = (projects || []).map((project) => project.id);
  let index = usedIds.length + 1;
  let id = `custom-project-${index}`;

  while (usedIds.indexOf(id) !== -1) {
    index += 1;
    id = `custom-project-${index}`;
  }

  return id;
}

function createProject(projects) {
  return {
    id: createUniqueProjectId(projects),
    name: '新项目',
    role: '项目角色',
    cover: '/assets/projects/resume-cover.jpg',
    screenshots: ['/assets/projects/resume-cover.jpg'],
    techStack: ['技术'],
    highlights: ['亮点'],
    challenges: [createChallenge()],
    metrics: ['成果']
  };
}

function createTimelineItem() {
  return {
    type: 'work',
    title: '新经历',
    organization: '组织名称',
    startDate: '2024-01',
    endDate: '',
    description: '经历描述'
  };
}

function updateSkillGroup(draft, detail) {
  const groupIndex = getIndex(detail.groupIndex);
  const group = draft.skillGroups[groupIndex];

  if (!group) {
    return draft;
  }

  group[detail.field] = detail.value;
  return draft;
}

function updateSkill(draft, detail) {
  const groupIndex = getIndex(detail.groupIndex);
  const skillIndex = getIndex(detail.skillIndex);
  const skill = draft.skillGroups[groupIndex]
    && draft.skillGroups[groupIndex].skills
    && draft.skillGroups[groupIndex].skills[skillIndex];

  if (!skill) {
    return draft;
  }

  if (detail.field === 'level') {
    skill.level = normalizeSkillLevel(detail.value);
    return draft;
  }

  if (detail.field === 'tagsText') {
    skill.tags = parseListText(detail.value);
    return draft;
  }

  skill[detail.field] = detail.value;
  return draft;
}

function updateProject(draft, detail) {
  const projectIndex = getIndex(detail.projectIndex);
  const project = draft.projects[projectIndex];

  if (!project) {
    return draft;
  }

  if (detail.field === 'techStackText') {
    project.techStack = parseListText(detail.value);
    return draft;
  }

  if (detail.field === 'highlightsText') {
    project.highlights = parseListText(detail.value);
    return draft;
  }

  if (detail.field === 'metricsText') {
    project.metrics = parseListText(detail.value);
    return draft;
  }

  if (detail.field === 'cover') {
    project.cover = detail.value;
    project.screenshots = detail.value ? [detail.value] : [];
    return draft;
  }

  project[detail.field] = detail.value;
  return draft;
}

function updateChallenge(draft, detail) {
  const projectIndex = getIndex(detail.projectIndex);
  const challengeIndex = getIndex(detail.challengeIndex);
  const challenge = draft.projects[projectIndex]
    && draft.projects[projectIndex].challenges
    && draft.projects[projectIndex].challenges[challengeIndex];

  if (!challenge) {
    return draft;
  }

  challenge[detail.field] = detail.value;
  return draft;
}

function updateTimeline(draft, detail) {
  const timelineIndex = getIndex(detail.timelineIndex);
  const item = draft.timeline[timelineIndex];

  if (!item) {
    return draft;
  }

  item[detail.field] = detail.value;
  return draft;
}

function addItem(draft, detail) {
  if (detail.section === 'skillGroup') {
    draft.skillGroups.push(createSkillGroup());
  }

  if (detail.section === 'skill') {
    const groupIndex = getIndex(detail.groupIndex);
    const group = draft.skillGroups[groupIndex];

    if (group) {
      group.skills.push(createSkill());
    }
  }

  if (detail.section === 'project') {
    draft.projects.push(createProject(draft.projects));
  }

  if (detail.section === 'challenge') {
    const projectIndex = getIndex(detail.projectIndex);
    const project = draft.projects[projectIndex];

    if (project) {
      project.challenges.push(createChallenge());
    }
  }

  if (detail.section === 'timeline') {
    draft.timeline.push(createTimelineItem());
  }

  return draft;
}

function removeByIndex(items, index, minLength) {
  if (!Array.isArray(items) || items.length <= minLength || index < 0 || index >= items.length) {
    return items;
  }

  items.splice(index, 1);
  return items;
}

function removeItem(draft, detail) {
  if (detail.section === 'skillGroup') {
    removeByIndex(draft.skillGroups, getIndex(detail.groupIndex), 1);
  }

  if (detail.section === 'skill') {
    const groupIndex = getIndex(detail.groupIndex);
    const group = draft.skillGroups[groupIndex];

    if (group) {
      removeByIndex(group.skills, getIndex(detail.skillIndex), 1);
    }
  }

  if (detail.section === 'project') {
    removeByIndex(draft.projects, getIndex(detail.projectIndex), 1);
  }

  if (detail.section === 'challenge') {
    const projectIndex = getIndex(detail.projectIndex);
    const project = draft.projects[projectIndex];

    if (project) {
      removeByIndex(project.challenges, getIndex(detail.challengeIndex), 1);
    }
  }

  if (detail.section === 'timeline') {
    removeByIndex(draft.timeline, getIndex(detail.timelineIndex), 0);
  }

  return draft;
}

function applyEdit(state, detail = {}) {
  const draft = getDraftFromState(state);

  if (detail.action === 'add') {
    return withDraft(state, addItem(draft, detail));
  }

  if (detail.action === 'remove') {
    return withDraft(state, removeItem(draft, detail));
  }

  if (detail.section === 'skillGroup') {
    return withDraft(state, updateSkillGroup(draft, detail));
  }

  if (detail.section === 'skill') {
    return withDraft(state, updateSkill(draft, detail));
  }

  if (detail.section === 'project') {
    return withDraft(state, updateProject(draft, detail));
  }

  if (detail.section === 'challenge') {
    return withDraft(state, updateChallenge(draft, detail));
  }

  if (detail.section === 'timeline') {
    return withDraft(state, updateTimeline(draft, detail));
  }

  return createEditorState(state);
}

module.exports = {
  TIMELINE_TYPES,
  parseListText,
  createEditorState,
  applyEdit
};
