function getTopSkills(skillGroups, limit = 8) {
  return skillGroups
    .reduce((skills, group) => skills.concat(group.skills), [])
    .sort((left, right) => right.level - left.level)
    .slice(0, limit)
    .map((skill) => ({
      name: skill.name,
      level: skill.level,
      tagText: skill.tagText
    }));
}

function getPrintProjects(projects) {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    role: project.role,
    summary: project.summary,
    techStackText: project.techStack.join(' / '),
    highlights: project.highlights.slice(0, 3),
    metrics: project.metrics.slice(0, 2)
  }));
}

function createPrintResumeModel(resume) {
  return {
    profile: resume.profile,
    contact: resume.profile.contact,
    skillGroups: resume.skillGroups,
    topSkills: getTopSkills(resume.skillGroups),
    projects: getPrintProjects(resume.projects),
    timeline: resume.timeline,
    printMeta: {
      title: '打印版简历',
      tip: '适合截图、导出 PDF 前核对和面试现场快速浏览'
    }
  };
}

module.exports = {
  getTopSkills,
  getPrintProjects,
  createPrintResumeModel
};
