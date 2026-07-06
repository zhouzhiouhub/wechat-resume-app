const HOME_SECTION_IDS = {
  PROFILE: 'profile',
  SKILLS: 'skills',
  PROJECTS: 'projects',
  CONTACT: 'contact',
  ALL: 'all'
};

const HOME_SECTIONS = [
  {
    id: HOME_SECTION_IDS.PROFILE,
    label: '名片',
    title: '个人名片',
    meta: '定位与基本信息'
  },
  {
    id: HOME_SECTION_IDS.SKILLS,
    label: '技能',
    title: '技能能力',
    meta: '技术栈与熟练度'
  },
  {
    id: HOME_SECTION_IDS.PROJECTS,
    label: '项目',
    title: '重点项目',
    meta: '作品与业务成果'
  },
  {
    id: HOME_SECTION_IDS.CONTACT,
    label: '联系',
    title: '联系方式',
    meta: '邮箱与微信入口'
  },
  {
    id: HOME_SECTION_IDS.ALL,
    label: '全部',
    title: '全部内容',
    meta: '名片、技能、项目、联系'
  }
];

const DEFAULT_HOME_SECTION_ID = HOME_SECTION_IDS.ALL;

function cloneSection(section, index) {
  const order = index + 1;

  return {
    ...section,
    order,
    indexLabel: order < 10 ? `0${order}` : String(order)
  };
}

function getHomeSections() {
  return HOME_SECTIONS.map(cloneSection);
}

function getHomeSectionsWithActive(activeSectionId) {
  const normalizedActiveSectionId = normalizeSectionId(activeSectionId);

  return getHomeSections().map((section) => ({
    ...section,
    isActive: section.id === normalizedActiveSectionId
  }));
}

function isKnownSection(sectionId) {
  return HOME_SECTIONS.some((section) => section.id === sectionId);
}

function normalizeSectionId(sectionId) {
  if (typeof sectionId !== 'string') {
    return DEFAULT_HOME_SECTION_ID;
  }

  const normalizedId = sectionId.trim();

  return isKnownSection(normalizedId) ? normalizedId : DEFAULT_HOME_SECTION_ID;
}

function getSectionById(sectionId) {
  const normalizedId = normalizeSectionId(sectionId);

  return getHomeSections().find((section) => section.id === normalizedId);
}

function isSectionVisible(activeSectionId, targetSectionId) {
  const normalizedActiveSectionId = normalizeSectionId(activeSectionId);

  return normalizedActiveSectionId === HOME_SECTION_IDS.ALL
    || normalizedActiveSectionId === targetSectionId;
}

function createHomeSectionState(activeSectionId = DEFAULT_HOME_SECTION_ID) {
  const activeSection = getSectionById(activeSectionId);

  return {
    sections: getHomeSectionsWithActive(activeSection.id),
    activeSection: activeSection.id,
    activeSectionTitle: activeSection.title,
    activeSectionMeta: activeSection.meta,
    isAllContent: activeSection.id === HOME_SECTION_IDS.ALL,
    showProfile: isSectionVisible(activeSection.id, HOME_SECTION_IDS.PROFILE),
    showSkills: isSectionVisible(activeSection.id, HOME_SECTION_IDS.SKILLS),
    showProjects: isSectionVisible(activeSection.id, HOME_SECTION_IDS.PROJECTS),
    showContact: isSectionVisible(activeSection.id, HOME_SECTION_IDS.CONTACT)
  };
}

module.exports = {
  HOME_SECTION_IDS,
  DEFAULT_HOME_SECTION_ID,
  getHomeSections,
  getHomeSectionsWithActive,
  isKnownSection,
  normalizeSectionId,
  createHomeSectionState
};
