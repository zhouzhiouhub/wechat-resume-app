const assert = require('assert');
const resumeData = require('../modules/resume/resumeData');
const resumeMapper = require('../modules/resume/resumeMapper');
const resumeService = require('../services/resumeService');
const contactService = require('../services/contactService');
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

runCheck('home resume exposes reusable component inputs', () => {
  const homeResume = resumeService.getHomeResume();

  assert.ok(homeResume.profile.name);
  assert.ok(homeResume.contact.email);
  assert.ok(homeResume.skillHighlights.length > 0);
  assert.ok(homeResume.skillGroups.length > 0);
  assert.ok(homeResume.featuredProjects.length > 0);

  homeResume.skillGroups.forEach((group) => {
    group.skills.forEach((skill) => {
      assert.strictEqual(typeof skill.tagText, 'string');
    });
  });

  homeResume.featuredProjects.forEach((project) => {
    assert.ok(project.id);
    assert.ok(project.cover);
    assert.ok(project.summary);
  });
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
  assert.ok(firstProject.gallery.length > 0);
  assert.ok(firstProject.techStack.length > 0);
  assert.ok(firstProject.challenges.length > 0);
  assert.ok(firstProject.metrics.length > 0);
});

runCheck('unknown project id returns null', () => {
  assert.strictEqual(resumeService.getProjectById('missing-project'), null);
  assert.strictEqual(resumeService.getProjectById(''), null);
});

runCheck('contact service validates and prepares interaction payloads', () => {
  const contact = resumeService.getProfile().contact;
  const validation = contactService.validateContactInfo(contact);
  const clipboardPayload = contactService.createClipboardPayload(contact.email);

  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(clipboardPayload.data, contact.email);
  assert.throws(() => contactService.createClipboardPayload('bad-email'), /valid email/);
  assert.throws(() => contactService.createPreviewPayload(''), /wechatQr/);
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
