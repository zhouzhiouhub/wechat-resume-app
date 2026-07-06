const assert = require('assert');
const resumeData = require('../modules/resume/resumeData');
const resumeMapper = require('../modules/resume/resumeMapper');
const resumeService = require('../services/resumeService');
const validator = require('../utils/validator');

function runCheck(name, check) {
  try {
    check();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}

runCheck('resume data maps without validation errors', () => {
  const resume = resumeMapper.mapResumeData(resumeData);

  assert.ok(resume.profile.name);
  assert.ok(resume.skillGroups.length > 0);
  assert.ok(resume.projects.length > 0);
});

runCheck('profile includes a valid contact email', () => {
  const profile = resumeService.getProfile();

  assert.ok(validator.isValidEmail(profile.contact.email));
});

runCheck('skill levels stay within 0-100', () => {
  const skillGroups = resumeService.getSkillGroups();

  skillGroups.forEach((group) => {
    group.skills.forEach((skill) => {
      assert.ok(validator.isValidSkillLevel(skill.level), `${skill.name} level is invalid`);
    });
  });
});

runCheck('project ids are unique and detail lookup works', () => {
  const projects = resumeService.getProjects();
  const projectIds = projects.map((project) => project.id);
  const firstProject = resumeService.getProjectById(projectIds[0]);

  assert.ok(validator.hasUniqueValues(projectIds));
  assert.strictEqual(firstProject.id, projectIds[0]);
});

runCheck('unknown project id returns null', () => {
  assert.strictEqual(resumeService.getProjectById('missing-project'), null);
  assert.strictEqual(resumeService.getProjectById(''), null);
});

runCheck('missing required fields report a clear validation error', () => {
  const invalidData = {
    ...resumeData,
    profile: {
      ...resumeData.profile,
      name: ''
    }
  };

  assert.throws(() => resumeMapper.mapResumeData(invalidData), /profile\.name/);
});

console.log('Resume data validation passed.');
