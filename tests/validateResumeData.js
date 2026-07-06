const assert = require('assert');
const fs = require('fs');
const path = require('path');
const resumeData = require('../modules/resume/resumeData');
const resumeMapper = require('../modules/resume/resumeMapper');
const resumeService = require('../services/resumeService');
const contactService = require('../services/contactService');
const resumeSectionService = require('../services/resumeSectionService');
const themeService = require('../services/themeService');
const posterService = require('../services/posterService');
const validator = require('../utils/validator');
const dateUtils = require('../utils/date');
const themeUtils = require('../utils/theme');

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
  assert.ok(homeResume.timeline.length > 0);

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

runCheck('timeline items are normalized and sorted by recent date', () => {
  const timeline = resumeService.getTimeline();

  assert.ok(timeline.length >= 2);
  timeline.forEach((item) => {
    assert.ok(validator.isValidYearMonth(item.startDate));
    assert.ok(item.endDate === '' || validator.isValidYearMonth(item.endDate));
    assert.ok(item.period);
    assert.ok(item.typeLabel);
  });

  for (let index = 1; index < timeline.length; index += 1) {
    const previousOrder = dateUtils.getYearMonthOrder(timeline[index - 1].endDate, 999999);
    const currentOrder = dateUtils.getYearMonthOrder(timeline[index].endDate, 999999);

    assert.ok(previousOrder >= currentOrder);
  }
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

runCheck('home section service keeps all content as the quick scan entry', () => {
  const sections = resumeSectionService.getHomeSections();
  const defaultState = resumeSectionService.createHomeSectionState();
  const projectState = resumeSectionService.createHomeSectionState('projects');

  assert.deepStrictEqual(
    sections.map((section) => section.id),
    ['profile', 'skills', 'projects', 'timeline', 'contact', 'settings', 'all']
  );
  assert.strictEqual(sections[sections.length - 1].id, 'all');
  assert.strictEqual(defaultState.activeSection, 'all');
  assert.strictEqual(defaultState.sections[6].isActive, true);
  assert.strictEqual(defaultState.showProfile, true);
  assert.strictEqual(defaultState.showSkills, true);
  assert.strictEqual(defaultState.showProjects, true);
  assert.strictEqual(defaultState.showTimeline, true);
  assert.strictEqual(defaultState.showContact, true);
  assert.strictEqual(defaultState.showSettings, false);
  assert.strictEqual(projectState.showProfile, false);
  assert.strictEqual(projectState.showProjects, true);
  assert.strictEqual(projectState.sections[2].isActive, true);
  assert.strictEqual(resumeSectionService.createHomeSectionState('settings').showSettings, true);
  assert.strictEqual(resumeSectionService.normalizeSectionId('missing'), 'all');
});

runCheck('theme service maps readable theme variables', () => {
  const darkState = themeService.createThemeState('dark');

  assert.strictEqual(darkState.activeTheme, 'dark');
  assert.ok(darkState.themeClass);
  assert.strictEqual(darkState.themeOptions.length >= 3, true);
  assert.strictEqual(themeService.createThemeState('missing').activeTheme, 'light');

  darkState.themeOptions.forEach((option) => {
    const variables = themeUtils.getThemeVariables(option.id);

    assert.ok(variables['--resume-bg']);
    assert.ok(variables['--resume-text']);
    assert.ok(themeUtils.hasReadableContrast(
      variables['--resume-text'],
      variables['--resume-surface']
    ));
  });
});

runCheck('theme switcher uses a tappable custom dropdown', () => {
  const switcherWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'theme-switcher', 'theme-switcher.wxml'),
    'utf8'
  );

  assert.strictEqual(switcherWxml.includes('<picker'), false);
  assert.ok(switcherWxml.includes('bindtap="onToggleDropdown"'));
  assert.ok(switcherWxml.includes('catchtap="onSelectTheme"'));
  assert.ok(switcherWxml.includes('data-theme-id="{{item.id}}"'));
});

runCheck('poster model is created from unified resume data', () => {
  const resume = resumeService.getResume();
  const poster = posterService.createPosterModel(resume);
  const renderPlan = posterService.createPosterRenderPlan(poster, 'dark');

  assert.strictEqual(poster.profile.name, resume.profile.name);
  assert.strictEqual(poster.contact.email, resume.profile.contact.email);
  assert.strictEqual(poster.skillTags.length, 3);
  assert.strictEqual(poster.projects.length, Math.min(resume.projects.length, 2));
  assert.strictEqual(renderPlan.canvas.width, 750);
  assert.strictEqual(renderPlan.canvas.height, 1200);
  assert.strictEqual(renderPlan.canvas.fileType, 'png');
  assert.strictEqual(renderPlan.palette.background, themeUtils.getThemeVariables('dark')['--resume-bg']);
  assert.ok(renderPlan.commands.length > 10);
  assert.ok(renderPlan.commands.some((command) => command.type === 'text' && command.text === resume.profile.name));
  assert.ok(renderPlan.commands.some((command) => command.type === 'roundRect'));
  assert.ok(renderPlan.commands.every((command) => ['roundRect', 'text', 'image'].includes(command.type)));
  assert.deepStrictEqual(
    renderPlan.sections.map((section) => section.id),
    ['profile', 'skills', 'projects', 'contact']
  );
});

runCheck('poster page exposes canvas save interaction', () => {
  const posterWxml = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'poster', 'poster.wxml'),
    'utf8'
  );
  const posterJs = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'poster', 'poster.js'),
    'utf8'
  );

  assert.ok(posterWxml.includes('canvas-id="{{posterCanvasId}}"'));
  assert.ok(posterWxml.includes('bindtap="onSavePoster"'));
  assert.ok(posterJs.includes('wx.createCanvasContext'));
  assert.ok(posterJs.includes('wx.canvasToTempFilePath'));
  assert.ok(posterJs.includes('wx.saveImageToPhotosAlbum'));
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
