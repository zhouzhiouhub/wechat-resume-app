const assert = require('assert');
const fs = require('fs');
const path = require('path');
const appConfig = require('../app.json');
const projectConfig = require('../project.config.json');
const envConfig = require('../config/env');
const resumeData = require('../modules/resume/resumeData');
const resumeMapper = require('../modules/resume/resumeMapper');
const resumeService = require('../services/resumeService');
const contactService = require('../services/contactService');
const resumeSectionService = require('../services/resumeSectionService');
const themeService = require('../services/themeService');
const profileAssetService = require('../services/profileAssetService');
const localResumeDataService = require('../services/localResumeDataService');
const resumeDataEditorService = require('../services/resumeDataEditorService');
const resumePreferenceService = require('../services/resumePreferenceService');
const resumeCustomizationService = require('../services/resumeCustomizationService');
const posterService = require('../services/posterService');
const printResumeService = require('../services/printResumeService');
const analyticsService = require('../services/analyticsService');
const authService = require('../services/authService');
const cloudDataService = require('../services/cloudDataService');
const feedbackService = require('../services/feedbackService');
const notificationService = require('../services/notificationService');
const releaseCheckService = require('../services/releaseCheckService');
const validator = require('../utils/validator');
const dateUtils = require('../utils/date');
const themeUtils = require('../utils/theme');
const tapCounter = require('../utils/tapCounter');

function runCheck(name, check) {
  try {
    check();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}

function createMockWxStorage(initialStorage = {}) {
  const storage = {
    ...initialStorage
  };

  return {
    storage,
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    }
  };
}

runCheck('resume data maps without validation errors', () => {
  const resume = resumeMapper.mapResumeData(resumeData);

  assert.ok(resume.profile.name);
  assert.ok(resume.skillGroups.length > 0);
  assert.ok(resume.projects.length > 0);
});

runCheck('default resume data keeps one template for repeatable sections', () => {
  assert.strictEqual(resumeData.skillGroups.length, 1);
  assert.strictEqual(resumeData.skillGroups[0].skills.length, 1);
  assert.strictEqual(resumeData.projects.length, 1);
  assert.strictEqual(resumeData.projects[0].techStack.length, 1);
  assert.strictEqual(resumeData.projects[0].highlights.length, 1);
  assert.strictEqual(resumeData.projects[0].metrics.length, 1);
  assert.strictEqual(resumeData.projects[0].challenges.length, 1);
  assert.strictEqual(resumeData.timeline.length, 1);
});

runCheck('profile includes valid contact methods', () => {
  const profile = resumeService.getProfile();

  assert.ok(validator.isValidEmail(profile.contact.email));
  assert.notStrictEqual(profile.contact.email, '2922188469@qq.com');
  assert.strictEqual(profile.contact.email, 'user@example.com');
  assert.strictEqual(profile.contact.phone, '13800000000');
  assert.deepStrictEqual(profile.contact.links, []);
});

runCheck('home resume exposes reusable component inputs', () => {
  const homeResume = resumeService.getHomeResume();

  assert.ok(homeResume.profile.name);
  assert.ok(homeResume.contact.email);
  assert.ok(homeResume.contact.phone);
  assert.ok(Array.isArray(homeResume.contact.links));
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

  assert.ok(timeline.length >= 1);
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

  assert.ok(projects.length >= 1);
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

runCheck('local resume data service stores per-user full resume data', () => {
  const mockWx = createMockWxStorage();
  const localResumeData = JSON.parse(JSON.stringify(resumeData));

  localResumeData.profile.name = '赵一';
  localResumeData.profile.title = '小程序开发工程师';
  localResumeData.profile.status = '开放合作';
  localResumeData.profile.summary = '专注微信小程序与前端工程化。';
  localResumeData.profile.location = '杭州';
  localResumeData.profile.contact.email = 'zhaoyi@example.com';
  localResumeData.profile.contact.phone = '13900000000';
  localResumeData.profile.contact.links = [
    {
      type: 'code',
      name: 'GitHub',
      valueType: 'url',
      value: 'https://github.com/zhaoyi'
    }
  ];
  localResumeData.skillGroups[0].skills[0].name = '微信小程序';
  localResumeData.projects[0].id = 'local-miniapp-project';
  localResumeData.projects[0].name = '本机保存项目';

  const payload = localResumeDataService.saveResumeData(mockWx, localResumeData, {
    now: 7000
  });
  const storedData = localResumeDataService.readResumeData(mockWx);
  const storedState = localResumeDataService.readResumeDataState(mockWx);
  const resume = resumeService.getResume(mockWx);
  const project = resumeCustomizationService.getProjectById(mockWx, 'local-miniapp-project');

  assert.strictEqual(payload.updatedAt, 7000);
  assert.strictEqual(storedData.profile.name, '赵一');
  assert.strictEqual(storedState.hasLocalData, true);
  assert.strictEqual(storedState.resumeData.projects[0].name, '本机保存项目');
  assert.strictEqual(resume.profile.contact.email, 'zhaoyi@example.com');
  assert.strictEqual(resume.profile.contact.phone, '13900000000');
  assert.strictEqual(resume.profile.contact.links[0].name, 'GitHub');
  assert.strictEqual(resume.profile.contact.links[0].actionLabel, '复制链接');
  assert.strictEqual(project.name, '本机保存项目');
  assert.throws(
    () => localResumeDataService.saveResumeData(mockWx, { profile: {} }),
    /skillGroups|profile/
  );

  localResumeDataService.clearResumeData(mockWx);
  assert.strictEqual(localResumeDataService.readResumeDataState(mockWx).hasLocalData, false);
});

runCheck('resume data editor service supports visual CRUD operations', () => {
  const baseState = localResumeDataService.createResumeDataState(resumeData);
  let editorState = resumeDataEditorService.createEditorState(baseState);

  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'skillGroup',
    groupIndex: 0,
    field: 'groupName',
    value: '小程序能力'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'skill',
    groupIndex: 0,
    skillIndex: 0,
    field: 'tagsText',
    value: '微信小程序、组件化、云开发'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'add',
    section: 'project'
  });
  const addedProjectIndex = editorState.draft.projects.length - 1;
  const addedProject = editorState.draft.projects[addedProjectIndex];

  assert.strictEqual(editorState.draft.projects.length, 2);
  assert.notStrictEqual(addedProject.id, editorState.draft.projects[0].id);
  assert.deepStrictEqual(addedProject.techStack, editorState.draft.projects[0].techStack);
  assert.deepStrictEqual(addedProject.challenges, editorState.draft.projects[0].challenges);

  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'project',
    projectIndex: addedProjectIndex,
    field: 'name',
    value: '可视化简历编辑器'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'add',
    section: 'skill',
    groupIndex: 0
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'add',
    section: 'timeline'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'add',
    section: 'challenge',
    projectIndex: 0
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'remove',
    section: 'timeline',
    timelineIndex: 0
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'add',
    section: 'contactLink'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'contactLink',
    linkIndex: 0,
    field: 'type',
    value: 'code'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'contactLink',
    linkIndex: 0,
    field: 'name',
    value: 'GitHub'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'contactLink',
    linkIndex: 0,
    field: 'valueType',
    value: 'url'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'contactLink',
    linkIndex: 0,
    field: 'value',
    value: 'https://github.com/example'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'add',
    section: 'contactLink'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'contactLink',
    linkIndex: 1,
    field: 'type',
    value: 'certificate'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'contactLink',
    linkIndex: 1,
    field: 'name',
    value: '证书编号'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'contactLink',
    linkIndex: 1,
    field: 'valueType',
    value: 'text'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'update',
    section: 'contactLink',
    linkIndex: 1,
    field: 'value',
    value: 'ABC-123456'
  });
  editorState = resumeDataEditorService.applyEdit(editorState, {
    action: 'remove',
    section: 'contactLink',
    linkIndex: 0
  });

  const normalizedResume = resumeMapper.mapResumeData(editorState.draft);

  assert.strictEqual(editorState.draft.skillGroups[0].groupName, '小程序能力');
  assert.deepStrictEqual(
    editorState.draft.skillGroups[0].skills[0].tags,
    ['微信小程序', '组件化', '云开发']
  );
  assert.strictEqual(editorState.draft.skillGroups[0].skills.length, 2);
  assert.notStrictEqual(
    editorState.draft.skillGroups[0].skills[1].name,
    editorState.draft.skillGroups[0].skills[0].name
  );
  assert.ok(editorState.draft.projects.some((project) => project.name === '可视化简历编辑器'));
  assert.strictEqual(editorState.draft.projects[0].challenges.length, 2);
  assert.strictEqual(editorState.draft.timeline.length, resumeData.timeline.length);
  assert.strictEqual(editorState.draft.profile.contact.links.length, 1);
  assert.strictEqual(editorState.draft.profile.contact.links[0].name, '证书编号');
  assert.strictEqual(editorState.draft.profile.contact.links[0].valueType, 'text');
  assert.ok(normalizedResume.projects.length >= 2);
  assert.strictEqual(normalizedResume.profile.contact.links[0].typeLabel, '证书');
  assert.strictEqual(normalizedResume.profile.contact.links[0].actionLabel, '复制内容');
});

runCheck('contact service validates and prepares interaction payloads', () => {
  const contact = resumeService.getProfile().contact;
  const validation = contactService.validateContactInfo(contact);
  const clipboardPayload = contactService.createClipboardPayload(contact.email);
  const phonePayload = contactService.createPhoneCallPayload(contact.phone);
  const textPayload = contactService.createTextClipboardPayload(' https://github.com/example ');

  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(validation.contact.phone, contact.phone);
  assert.strictEqual(clipboardPayload.data, contact.email);
  assert.strictEqual(phonePayload.phoneNumber, contact.phone);
  assert.strictEqual(textPayload.data, 'https://github.com/example');
  assert.throws(() => contactService.createClipboardPayload('bad-email'), /valid email/);
  assert.throws(() => contactService.createPhoneCallPayload(''), /phone/);
  assert.throws(() => contactService.createTextClipboardPayload(''), /value/);
  assert.throws(() => contactService.createPreviewPayload(''), /wechatQr/);
});

runCheck('home section service keeps all content as the quick scan entry', () => {
  const sections = resumeSectionService.getHomeSections();
  const defaultState = resumeSectionService.createHomeSectionState();
  const projectState = resumeSectionService.createHomeSectionState('projects');

  assert.deepStrictEqual(
    sections.map((section) => section.id),
    ['profile', 'skills', 'projects', 'timeline', 'contact', 'tools', 'settings', 'all']
  );
  assert.strictEqual(sections[sections.length - 1].id, 'all');
  assert.strictEqual(defaultState.activeSection, 'all');
  assert.strictEqual(defaultState.sections[7].isActive, true);
  assert.strictEqual(defaultState.showProfile, true);
  assert.strictEqual(defaultState.showSkills, true);
  assert.strictEqual(defaultState.showProjects, true);
  assert.strictEqual(defaultState.showTimeline, true);
  assert.strictEqual(defaultState.showContact, true);
  assert.strictEqual(defaultState.showTools, false);
  assert.ok(defaultState.activeSectionMeta.indexOf('工具') === -1);
  assert.strictEqual(defaultState.showSettings, false);
  assert.strictEqual(projectState.showProfile, false);
  assert.strictEqual(projectState.showProjects, true);
  assert.strictEqual(projectState.sections[2].isActive, true);
  assert.strictEqual(resumeSectionService.createHomeSectionState('tools').showTools, true);
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

runCheck('profile asset service stores local images and applies them to resume views', () => {
  const mockWx = createMockWxStorage();
  const profile = resumeService.getProfile();
  const avatarPath = 'wxfile://avatar.png';
  const wechatQrPath = 'wxfile://wechat-qr.png';

  let assets = profileAssetService.saveProfileAsset(
    mockWx,
    profileAssetService.ASSET_FIELDS.AVATAR,
    ` ${avatarPath} `
  );

  assets = profileAssetService.saveProfileAsset(
    mockWx,
    profileAssetService.ASSET_FIELDS.WECHAT_QR,
    wechatQrPath
  );

  const appliedProfile = profileAssetService.applyAssetsToProfile(profile, assets);
  const appliedResume = profileAssetService.applyAssetsToResume(resumeService.getResume(), assets);
  const state = profileAssetService.createProfileAssetState(profile, assets);
  const clearedAssets = profileAssetService.clearProfileAsset(
    mockWx,
    profileAssetService.ASSET_FIELDS.AVATAR
  );

  assert.strictEqual(assets.avatar, avatarPath);
  assert.strictEqual(assets.wechatQr, wechatQrPath);
  assert.strictEqual(appliedProfile.avatar, avatarPath);
  assert.strictEqual(appliedProfile.contact.wechatQr, wechatQrPath);
  assert.strictEqual(appliedResume.profile.avatar, avatarPath);
  assert.strictEqual(appliedResume.profile.contact.wechatQr, wechatQrPath);
  assert.deepStrictEqual(
    state.items.map((item) => item.field),
    [
      profileAssetService.ASSET_FIELDS.AVATAR,
      profileAssetService.ASSET_FIELDS.WECHAT_QR
    ]
  );
  assert.strictEqual(state.avatar.hasAsset, true);
  assert.strictEqual(state.wechatQr.hasAsset, true);
  assert.strictEqual(clearedAssets.avatar, '');
  assert.strictEqual(clearedAssets.wechatQr, wechatQrPath);
  assert.throws(() => profileAssetService.saveProfileAsset(mockWx, 'bad', avatarPath), /unknown/);
});

runCheck('resume preference service stores profile and display overrides', () => {
  const mockWx = createMockWxStorage();
  const preferences = resumePreferenceService.saveResumePreferences(mockWx, {
    profile: {
      name: '李明',
      title: '前端工程师',
      status: '开放远程机会',
      summary: '专注小程序、React 和工程化交付。',
      location: '广州',
      email: 'liming@example.com',
      phone: '13811112222'
    },
    display: {
      initialSection: 'projects',
      featuredProjectCount: 2,
      showPoster: false,
      showPrint: true,
      showFeedback: false,
      showCustomerService: true
    }
  });
  const resume = resumePreferenceService.applyPreferencesToResume(
    resumeService.getResume(),
    preferences
  );
  const state = resumePreferenceService.createPreferenceState(
    resumeService.getResume(),
    preferences
  );

  assert.strictEqual(resume.profile.name, '李明');
  assert.strictEqual(resume.profile.initials, '李');
  assert.strictEqual(resume.profile.title, '前端工程师');
  assert.strictEqual(resume.profile.contact.email, 'liming@example.com');
  assert.strictEqual(resume.profile.contact.phone, '13811112222');
  assert.strictEqual(preferences.display.initialSection, 'projects');
  assert.strictEqual(preferences.display.featuredProjectCount, 2);
  assert.strictEqual(preferences.display.showPoster, false);
  assert.strictEqual(state.profileDraft.email, 'liming@example.com');
  assert.strictEqual(state.profileDraft.phone, '13811112222');
  assert.strictEqual(
    state.sectionOptions.find((item) => item.id === 'projects').isActive,
    true
  );
  assert.strictEqual(
    state.displaySwitches.find((item) => item.field === 'showPoster').checked,
    false
  );
  assert.throws(
    () => resumePreferenceService.saveResumePreferences(mockWx, {
      profile: {
        ...state.profileDraft,
        email: 'bad-email'
      },
      display: state.displayDraft
    }),
    /邮箱格式不正确/
  );

  resumePreferenceService.clearResumePreferences(mockWx);
  assert.strictEqual(
    resumePreferenceService.readResumePreferences(mockWx).display.featuredProjectCount,
    3
  );
});

runCheck('resume customization service combines preferences, assets and home display count', () => {
  const mockWx = createMockWxStorage();

  resumePreferenceService.saveResumePreferences(mockWx, {
    profile: {
      name: '王强',
      title: '全栈工程师',
      status: '优先深圳机会',
      summary: '覆盖前端、后端和自动化工具交付。',
      location: '深圳',
      email: 'wangqiang@example.com',
      phone: '13711112222'
    },
    display: {
      initialSection: 'contact',
      featuredProjectCount: 1,
      showPoster: true,
      showPrint: false,
      showFeedback: true,
      showCustomerService: false
    }
  });
  profileAssetService.saveProfileAsset(
    mockWx,
    profileAssetService.ASSET_FIELDS.AVATAR,
    'wxfile://custom-avatar.png'
  );
  profileAssetService.saveProfileAsset(
    mockWx,
    profileAssetService.ASSET_FIELDS.WECHAT_QR,
    'wxfile://custom-qr.png'
  );

  const homeResume = resumeCustomizationService.getHomeResume(mockWx);
  const resume = resumeCustomizationService.getResume(mockWx);

  assert.strictEqual(homeResume.profile.name, '王强');
  assert.strictEqual(homeResume.contact.email, 'wangqiang@example.com');
  assert.strictEqual(homeResume.contact.phone, '13711112222');
  assert.strictEqual(homeResume.profile.avatar, 'wxfile://custom-avatar.png');
  assert.strictEqual(homeResume.contact.wechatQr, 'wxfile://custom-qr.png');
  assert.strictEqual(homeResume.featuredProjects.length, 1);
  assert.strictEqual(homeResume.displayPreferences.initialSection, 'contact');
  assert.strictEqual(homeResume.displayPreferences.showPrint, false);
  assert.strictEqual(homeResume.displayPreferences.showCustomerService, false);
  assert.strictEqual(resume.profile.contact.email, 'wangqiang@example.com');
  assert.strictEqual(resume.profile.contact.phone, '13711112222');
});

runCheck('poster model is created from unified resume data', () => {
  const resume = resumeService.getResume();
  const resumeWithLink = JSON.parse(JSON.stringify(resume));

  resumeWithLink.profile.contact.links = [
    {
      type: 'code',
      name: 'GitHub',
      valueType: 'url',
      value: 'https://github.com/example'
    }
  ];

  const poster = posterService.createPosterModel(resume);
  const posterWithLink = posterService.createPosterModel(resumeWithLink);
  const renderPlan = posterService.createPosterRenderPlan(poster, 'dark');
  const renderPlanWithLink = posterService.createPosterRenderPlan(posterWithLink, 'dark');

  assert.strictEqual(poster.profile.name, resume.profile.name);
  assert.strictEqual(poster.contact.email, resume.profile.contact.email);
  assert.strictEqual(poster.contact.phone, resume.profile.contact.phone);
  assert.deepStrictEqual(poster.contact.links, []);
  assert.strictEqual(posterWithLink.contact.links[0].name, 'GitHub');
  assert.strictEqual(
    poster.skillTags.length,
    Math.min(resume.skillGroups.reduce((total, group) => total + group.skills.length, 0), 3)
  );
  assert.strictEqual(poster.projects.length, Math.min(resume.projects.length, 2));
  assert.strictEqual(renderPlan.canvas.width, 750);
  assert.strictEqual(renderPlan.canvas.height, 1200);
  assert.strictEqual(renderPlan.canvas.fileType, 'png');
  assert.strictEqual(renderPlan.palette.background, themeUtils.getThemeVariables('dark')['--resume-bg']);
  assert.ok(renderPlan.commands.length > 10);
  assert.ok(renderPlan.commands.some((command) => command.type === 'text' && command.text === resume.profile.name));
  assert.ok(renderPlan.commands.some((command) => command.type === 'text' && command.text === resume.profile.contact.phone));
  assert.ok(renderPlanWithLink.commands.some((command) => command.type === 'text' && command.text.indexOf('GitHub') !== -1));
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

runCheck('print resume model exposes compact interview-ready sections', () => {
  const resume = resumeService.getResume();
  const printResume = printResumeService.createPrintResumeModel(resume);

  assert.strictEqual(printResume.profile.name, resume.profile.name);
  assert.strictEqual(printResume.contact.email, resume.profile.contact.email);
  assert.strictEqual(printResume.contact.phone, resume.profile.contact.phone);
  assert.ok(Array.isArray(printResume.contact.links));
  assert.ok(printResume.topSkills.length > 0);
  assert.ok(printResume.topSkills.length <= 8);
  assert.strictEqual(printResume.projects.length, resume.projects.length);
  assert.ok(printResume.projects[0].techStackText.length > 0);
  assert.strictEqual(printResume.timeline.length, resume.timeline.length);
});

runCheck('analytics service builds events and dashboard metrics', () => {
  const mockWx = createMockWxStorage();

  analyticsService.recordEvent(
    mockWx,
    analyticsService.EVENT_NAMES.PAGE_VIEW,
    { page: 'home' },
    { now: 1000, eventId: 'event-1' }
  );
  analyticsService.recordEvent(
    mockWx,
    analyticsService.EVENT_NAMES.PROJECT_OPEN,
    { projectId: 'wechat-resume-app', projectName: '微信简历小程序' },
    { now: 2000, eventId: 'event-2' }
  );
  analyticsService.recordEvent(
    mockWx,
    analyticsService.EVENT_NAMES.CONTACT_COPY,
    { page: 'home' },
    { now: 3000, eventId: 'event-3' }
  );
  analyticsService.recordEvent(
    mockWx,
    analyticsService.EVENT_NAMES.PAGE_STAY,
    { page: 'home', durationMs: 31000 },
    { now: 4000, eventId: 'event-4' }
  );
  analyticsService.recordEvent(
    mockWx,
    analyticsService.EVENT_NAMES.FEEDBACK_SUBMIT,
    { feedbackType: 'question' },
    { now: 5000, eventId: 'event-5' }
  );

  const events = analyticsService.readEvents(mockWx);
  const metrics = analyticsService.getDashboardMetrics(events);

  assert.strictEqual(events.length, 5);
  assert.strictEqual(metrics.totalVisits, 1);
  assert.strictEqual(metrics.projectClickCount, 1);
  assert.strictEqual(metrics.contactClickCount, 1);
  assert.strictEqual(metrics.averageStaySeconds, 31);
  assert.strictEqual(metrics.feedbackSubmitCount, 1);
  assert.strictEqual(metrics.topProjects[0].name, '微信简历小程序');
  assert.strictEqual(metrics.recentEvents[0].id, 'event-5');
  assert.throws(
    () => analyticsService.createAnalyticsEvent('unknown_event'),
    /Unknown analytics event/
  );
});

runCheck('tap counter triggers only after the configured hidden sequence', () => {
  let state = tapCounter.createTapState({
    requiredTaps: 3,
    timeoutMs: 120
  });

  state = tapCounter.recordTap(state, 1000);
  assert.strictEqual(state.count, 1);
  assert.strictEqual(state.isTriggered, false);

  state = tapCounter.recordTap(state, 1060);
  assert.strictEqual(state.count, 2);
  assert.strictEqual(state.isTriggered, false);

  state = tapCounter.recordTap(state, 1120);
  assert.strictEqual(state.count, 0);
  assert.strictEqual(state.isTriggered, true);

  state = tapCounter.createTapState({
    requiredTaps: 3,
    timeoutMs: 100
  });
  state = tapCounter.recordTap(state, 2000);
  state = tapCounter.recordTap(state, 2201);
  assert.strictEqual(state.count, 1);
  assert.strictEqual(state.isTriggered, false);
});

runCheck('feedback service validates and stores visitor messages', () => {
  const mockWx = createMockWxStorage();
  const validInput = {
    type: 'question',
    name: '面试官',
    contact: 'interviewer@example.com',
    content: '想了解项目性能优化细节'
  };
  const validation = feedbackService.validateFeedbackInput(validInput);
  const record = feedbackService.submitFeedback(mockWx, validInput, {
    now: 6000,
    feedbackId: 'feedback-1'
  });
  const summary = feedbackService.getFeedbackSummary(feedbackService.readFeedback(mockWx));

  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(record.id, 'feedback-1');
  assert.strictEqual(record.typeLabel, '问题');
  assert.strictEqual(summary.total, 1);
  assert.strictEqual(summary.typeCounts[0].count, 1);
  assert.strictEqual(summary.latest[0].id, 'feedback-1');
  assert.strictEqual(feedbackService.validateFeedbackInput({ content: '短' }).isValid, false);
  assert.strictEqual(feedbackService.validateFeedbackInput({
    content: '这是一条有效留言',
    contact: 'bad@mail'
  }).isValid, false);
});

runCheck('M4 pages are registered and wired through isolated entries', () => {
  const appJson = fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8');
  const homeWxml = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.wxml'), 'utf8');
  const homeJs = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.js'), 'utf8');
  const profileCardWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'profile-card', 'profile-card.wxml'),
    'utf8'
  );
  const contactPanelWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'contact-panel', 'contact-panel.wxml'),
    'utf8'
  );
  const toolPanelWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'tool-panel', 'tool-panel.wxml'),
    'utf8'
  );
  const skillOverviewWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'skill-overview', 'skill-overview.wxml'),
    'utf8'
  );
  const timelineWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'timeline', 'timeline.wxml'),
    'utf8'
  );
  const dashboardJs = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'admin-dashboard', 'admin-dashboard.js'),
    'utf8'
  );
  const feedbackJs = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'feedback', 'feedback.js'),
    'utf8'
  );

  assert.ok(appJson.includes('pages/admin-dashboard/admin-dashboard'));
  assert.ok(appJson.includes('pages/feedback/feedback'));
  assert.ok(profileCardWxml.includes('bindtap="handleAvatarTap"'));
  assert.ok(homeWxml.includes('bind:avatartap="onAvatarTap"'));
  assert.ok(homeWxml.includes('bind:openfeedback="onOpenFeedback"'));
  assert.ok(homeJs.includes('tapCounter.recordTap'));
  assert.ok(homeJs.includes('/pages/admin-dashboard/admin-dashboard'));
  assert.ok(contactPanelWxml.includes('bindtap="handleCallPhone"'));
  assert.ok(toolPanelWxml.includes('bindtap="handleOpenFeedback"'));
  assert.ok(!homeWxml.includes('精选 {{featuredProjectCount}} 项'));
  assert.ok(!skillOverviewWxml.includes('按能力场景归类'));
  assert.ok(!timelineWxml.includes('按时间倒序'));
  assert.ok(!contactPanelWxml.includes('邮箱 / 手机 / 微信'));
  assert.ok(!toolPanelWxml.includes('分享与辅助操作'));
  assert.ok(dashboardJs.includes('analyticsService.createDashboardState'));
  assert.ok(dashboardJs.includes('feedbackService.getFeedbackSummary'));
  assert.ok(feedbackJs.includes('feedbackService.submitFeedback'));
  assert.ok(feedbackJs.includes('analyticsService.EVENT_NAMES.FEEDBACK_SUBMIT'));
});

runCheck('cloud data service builds switchable cloud requests', () => {
  const disabledEnv = {
    cloud: {
      enabled: false,
      envId: '',
      functionName: 'resumeData'
    }
  };
  const enabledEnv = {
    cloud: {
      enabled: true,
      envId: 'test-env',
      functionName: 'resumeData'
    }
  };
  const request = cloudDataService.createCloudRequest(
    cloudDataService.CLOUD_ACTIONS.RECORD_ANALYTICS,
    { event: { name: 'page_view' } },
    { now: 7000 }
  );

  assert.strictEqual(cloudDataService.isCloudEnabled({ envConfig: disabledEnv }), false);
  assert.strictEqual(cloudDataService.isCloudEnabled({ envConfig: enabledEnv }), true);
  assert.strictEqual(request.action, 'recordAnalytics');
  assert.strictEqual(request.meta.client, 'miniprogram');
  assert.strictEqual(request.meta.requestedAt, 7000);
});

runCheck('admin auth service protects dashboard with expiring local grant', () => {
  const mockWx = createMockWxStorage();
  const testEnv = {
    admin: {
      localAccessTtlMs: 500,
      allowedOpenIds: ['OPENID_ADMIN']
    }
  };
  const grant = authService.grantAdminAccess(mockWx, {
    now: 1000,
    envConfig: testEnv,
    source: 'test'
  });
  const guardState = authService.getAdminGuardState(mockWx, {
    now: 1200
  });
  const expiredGuardState = authService.getAdminGuardState(mockWx, {
    now: 1601
  });
  const request = authService.createAdminCheckRequest('OPENID_ADMIN', {
    envConfig: testEnv
  });

  assert.strictEqual(grant.expiresAt, 1500);
  assert.strictEqual(guardState.isAuthorized, true);
  assert.strictEqual(expiredGuardState.isAuthorized, false);
  assert.deepStrictEqual(request.allowedOpenIds, ['OPENID_ADMIN']);
});

runCheck('notification service creates non-blocking project browse payloads', () => {
  const testEnv = {
    subscription: {
      enabled: true,
      projectBrowseTemplateId: 'template-id',
      page: 'pages/admin-dashboard/admin-dashboard'
    }
  };
  const notification = notificationService.createProjectBrowseNotification(
    {
      id: 'wechat-resume-app',
      name: '微信简历小程序',
      role: '独立开发'
    },
    {
      envConfig: testEnv,
      toUser: 'OPENID_ADMIN',
      now: 1783305600000
    }
  );

  assert.strictEqual(notification.type, 'project_browse');
  assert.strictEqual(notification.templateId, 'template-id');
  assert.strictEqual(notification.toUser, 'OPENID_ADMIN');
  assert.strictEqual(notification.page, 'pages/admin-dashboard/admin-dashboard');
  assert.ok(notification.data.thing1.value.length <= 20);
  assert.strictEqual(notificationService.isSubscriptionEnabled({ envConfig: testEnv }), true);
  assert.strictEqual(notificationService.isSubscriptionEnabled(), false);
});

runCheck('release checklist reports publish blockers and warnings', () => {
  const releaseChecklist = releaseCheckService.createReleaseChecklist({
    resume: resumeService.getResume(),
    appConfig,
    projectConfig,
    envConfig
  });

  assert.strictEqual(releaseChecklist.isReleaseBlocked, false);
  assert.strictEqual(releaseChecklist.summary.fail, 0);
  assert.ok(releaseChecklist.checks.some((check) => check.id === 'page:pages/print/print' && check.status === 'pass'));
  assert.ok(releaseChecklist.checks.some((check) => check.id === 'project:cloudRoot' && check.status === 'pass'));
  assert.ok(releaseChecklist.checks.some((check) => check.id === 'cloud:enabled' && check.status === 'warn'));
  assert.ok(releaseChecklist.checks.some((check) => check.id === 'resume:email' && check.status === 'warn'));
});

runCheck('M5 cloud, auth, notification and release files are wired', () => {
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const homeWxml = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.wxml'), 'utf8');
  const homeJs = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.js'), 'utf8');
  const projectCardWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'project-card', 'project-card.wxml'),
    'utf8'
  );
  const projectDetailJs = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'project-detail', 'project-detail.js'),
    'utf8'
  );
  const projectDetailWxml = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'project-detail', 'project-detail.wxml'),
    'utf8'
  );
  const dashboardJs = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'admin-dashboard', 'admin-dashboard.js'),
    'utf8'
  );
  const dashboardWxml = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'admin-dashboard', 'admin-dashboard.wxml'),
    'utf8'
  );
  const cloudFunctionJs = fs.readFileSync(
    path.join(__dirname, '..', 'cloudfunctions', 'resumeData', 'index.js'),
    'utf8'
  );
  const cloudSamples = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'cloud-api-samples.md'),
    'utf8'
  );

  assert.strictEqual(projectConfig.cloudfunctionRoot, 'cloudfunctions/');
  assert.ok(appJs.includes('wxApi.cloud.init'));
  assert.ok(homeJs.includes('authService.grantAdminAccess'));
  assert.ok(homeJs.includes('/pages/print/print'));
  assert.ok(!homeWxml.includes('精选 {{featuredProjectCount}} 项'));
  assert.ok(homeWxml.includes('bind:openprint="onOpenPrint"'));
  assert.ok(projectCardWxml.includes('lazy-load="{{true}}"'));
  assert.ok(projectDetailWxml.includes('lazy-load="{{true}}"'));
  assert.ok(projectDetailJs.includes('sendProjectBrowseNotification'));
  assert.ok(dashboardJs.includes('authService.getAdminGuardState'));
  assert.ok(dashboardWxml.includes('看板已保护'));
  assert.ok(cloudFunctionJs.includes("action === 'recordAnalytics'"));
  assert.ok(cloudFunctionJs.includes("action === 'sendNotification'"));
  assert.ok(cloudSamples.includes("action: 'checkAdmin'"));
});

runCheck('finish-up print page is registered and wired from tool panel', () => {
  const appJson = fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8');
  const toolPanelWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'tool-panel', 'tool-panel.wxml'),
    'utf8'
  );
  const printJs = fs.readFileSync(path.join(__dirname, '..', 'pages', 'print', 'print.js'), 'utf8');
  const printWxml = fs.readFileSync(path.join(__dirname, '..', 'pages', 'print', 'print.wxml'), 'utf8');

  assert.ok(appJson.includes('pages/print/print'));
  assert.ok(toolPanelWxml.includes('bindtap="handleOpenPrint"'));
  assert.ok(printJs.includes('printResumeService.createPrintResumeModel'));
  assert.ok(printWxml.includes('{{printResume.printMeta.title}}'));
  assert.ok(printWxml.includes('{{printResume.contact.phone}}'));
  assert.strictEqual(
    printResumeService.createPrintResumeModel(resumeService.getResume()).printMeta.title,
    '打印版简历'
  );
});

runCheck('profile asset selection is wired through settings, poster and print views', () => {
  const homeJson = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.json'), 'utf8');
  const homeWxml = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.wxml'), 'utf8');
  const homeJs = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.js'), 'utf8');
  const assetSettingsWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'profile-asset-settings', 'profile-asset-settings.wxml'),
    'utf8'
  );
  const assetSettingsJs = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'profile-asset-settings', 'profile-asset-settings.js'),
    'utf8'
  );
  const profileAssetJs = fs.readFileSync(
    path.join(__dirname, '..', 'services', 'profileAssetService.js'),
    'utf8'
  );
  const posterJs = fs.readFileSync(path.join(__dirname, '..', 'pages', 'poster', 'poster.js'), 'utf8');
  const printJs = fs.readFileSync(path.join(__dirname, '..', 'pages', 'print', 'print.js'), 'utf8');
  const printWxml = fs.readFileSync(path.join(__dirname, '..', 'pages', 'print', 'print.wxml'), 'utf8');

  assert.ok(homeJson.includes('profile-asset-settings'));
  assert.ok(homeWxml.includes('asset-state="{{profileAssetState}}"'));
  assert.ok(homeWxml.includes('bind:selectasset="onSelectProfileAsset"'));
  assert.ok(homeWxml.includes('bind:clearasset="onClearProfileAsset"'));
  assert.ok(homeJs.includes('chooseAndSaveProfileAsset'));
  assert.ok(assetSettingsWxml.includes('wx:for="{{assetState.items}}"'));
  assert.ok(assetSettingsWxml.includes('bindtap="handleSelectAsset"'));
  assert.ok(assetSettingsJs.includes('this.triggerEvent'));
  assert.ok(profileAssetJs.includes('chooseMedia'));
  assert.ok(profileAssetJs.includes('chooseImage'));
  assert.ok(profileAssetJs.includes('saveFile'));
  assert.ok(posterJs.includes('resumeCustomizationService.getResume'));
  assert.ok(posterJs.includes('posterService.createPosterModel'));
  assert.ok(printJs.includes('resumeCustomizationService.getResume'));
  assert.ok(printWxml.includes('printResume.profile.avatar'));
});

runCheck('resume preference settings are wired through home contact and tool panels', () => {
  const homeJson = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.json'), 'utf8');
  const homeWxml = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.wxml'), 'utf8');
  const homeJs = fs.readFileSync(path.join(__dirname, '..', 'pages', 'home', 'home.js'), 'utf8');
  const contactPanelWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'contact-panel', 'contact-panel.wxml'),
    'utf8'
  );
  const toolPanelWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'tool-panel', 'tool-panel.wxml'),
    'utf8'
  );
  const assetSettingsWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'profile-asset-settings', 'profile-asset-settings.wxml'),
    'utf8'
  );
  const preferenceWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'resume-preference-settings', 'resume-preference-settings.wxml'),
    'utf8'
  );
  const preferenceJs = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'resume-preference-settings', 'resume-preference-settings.js'),
    'utf8'
  );
  const preferenceWxss = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'resume-preference-settings', 'resume-preference-settings.wxss'),
    'utf8'
  );
  const assetSettingsWxss = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'profile-asset-settings', 'profile-asset-settings.wxss'),
    'utf8'
  );
  const dataEditorWxml = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'resume-data-editor', 'resume-data-editor.wxml'),
    'utf8'
  );
  const dataEditorJs = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'resume-data-editor', 'resume-data-editor.js'),
    'utf8'
  );
  const dataEditorWxss = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'resume-data-editor', 'resume-data-editor.wxss'),
    'utf8'
  );
  const settingsButtonsWxss = fs.readFileSync(
    path.join(__dirname, '..', 'styles', 'settings-buttons.wxss'),
    'utf8'
  );

  assert.ok(homeJson.includes('resume-preference-settings'));
  assert.ok(homeJson.includes('resume-data-editor'));
  assert.ok(homeJson.includes('tool-panel'));
  assert.ok(homeWxml.includes('preference-state="{{preferenceState}}"'));
  assert.ok(homeWxml.includes('editor-state="{{resumeDataState}}"'));
  assert.ok(homeWxml.includes('display="{{displayPreferences}}"'));
  assert.ok(homeWxml.includes('bind:callphone="onCallPhone"'));
  assert.ok(homeWxml.includes('bind:copylink="onCopyContactLink"'));
  assert.ok(!homeWxml.includes('content-meta'));
  assert.ok(!homeWxml.includes('{{activeSectionMeta}}'));
  assert.ok(homeWxml.includes('bind:savepreferences="onSaveResumePreferences"'));
  assert.ok(!homeWxml.includes('bind:displaychange="onPreferenceDisplayChange"'));
  assert.ok(homeWxml.includes('bind:saveresumedata="onSaveResumeData"'));
  assert.ok(!homeWxml.includes('bind:resetresumedata="onResetResumeData"'));
  assert.ok(homeJs.includes('resumeCustomizationService.getHomeResume'));
  assert.ok(homeJs.includes('resumeDataEditorService.applyEdit'));
  assert.ok(homeJs.includes('localResumeDataService.saveResumeData'));
  assert.ok(homeJs.includes('resumePreferenceService.saveResumePreferences'));
  assert.ok(homeJs.includes('resumePreferenceService.clearResumePreferences'));
  assert.ok(homeJs.includes('contactService.callPhone'));
  assert.ok(homeJs.includes('contactService.copyText'));
  assert.ok(!homeJs.includes('onPreferenceDisplayChange'));
  assert.ok(contactPanelWxml.includes('{{contact.phone}}'));
  assert.ok(contactPanelWxml.includes('bindtap="handleCallPhone"'));
  assert.ok(contactPanelWxml.includes('contact.links'));
  assert.ok(contactPanelWxml.includes('bindtap="handleCopyLink"'));
  assert.ok(contactPanelWxml.includes('{{link.actionLabel}}'));
  assert.ok(!contactPanelWxml.includes('display.showPoster'));
  assert.ok(!contactPanelWxml.includes('display.showCustomerService'));
  assert.ok(!contactPanelWxml.includes('handleOpenPrint'));
  assert.ok(!contactPanelWxml.includes('handleOpenFeedback'));
  assert.ok(toolPanelWxml.includes('display.showPoster'));
  assert.ok(toolPanelWxml.includes('display.showPrint'));
  assert.ok(toolPanelWxml.includes('display.showFeedback'));
  assert.ok(toolPanelWxml.includes('display.showCustomerService'));
  assert.ok(preferenceWxml.includes('bindinput="handleProfileInput"'));
  assert.ok(preferenceWxml.includes('data-field="phone"'));
  assert.ok(!preferenceWxml.includes('preference-title-row'));
  assert.ok(!preferenceWxml.includes('preference-meta'));
  assert.ok(!preferenceWxml.includes('json-input'));
  assert.ok(!preferenceWxml.includes('展示偏好'));
  assert.ok(!preferenceWxml.includes('默认栏目'));
  assert.ok(!preferenceWxml.includes('handleFeaturedProjectCountStep'));
  assert.ok(!preferenceWxml.includes('handleDisplaySwitchChange'));
  assert.ok(!preferenceJs.includes("field: 'initialSection'"));
  assert.ok(preferenceWxss.includes('@import "../../styles/settings-buttons.wxss";'));
  assert.ok(assetSettingsWxss.includes('@import "../../styles/settings-buttons.wxss";'));
  assert.ok(dataEditorWxss.includes('@import "../../styles/settings-buttons.wxss";'));
  assert.ok(preferenceWxml.includes('preference-actions settings-button-row is-between'));
  assert.ok(preferenceWxml.includes('settings-button settings-button-action settings-button-primary'));
  assert.ok(preferenceWxml.includes('settings-button settings-button-action settings-button-secondary'));
  assert.ok(assetSettingsWxml.includes('asset-actions settings-button-row'));
  assert.ok(assetSettingsWxml.includes('settings-button settings-button-action settings-button-primary'));
  assert.ok(assetSettingsWxml.includes('settings-button settings-button-action settings-button-secondary'));
  assert.ok(dataEditorWxml.includes('data-section="project"'));
  assert.ok(dataEditorWxml.includes('data-section="skill"'));
  assert.ok(dataEditorWxml.includes('data-section="timeline"'));
  assert.ok(dataEditorWxml.includes('data-section="contactLink"'));
  assert.ok(dataEditorWxml.includes("activeTab === 'links'"));
  assert.ok(dataEditorWxml.includes('contactLinkTypes'));
  assert.ok(dataEditorWxml.includes('contactLinkValueTypes'));
  assert.ok(dataEditorJs.includes("id: 'links'"));
  assert.ok(dataEditorJs.includes('handleContactLinkTypeTap'));
  assert.ok(dataEditorJs.includes('handleContactLinkValueTypeTap'));
  assert.ok(dataEditorJs.includes('handleRemoveActive'));
  assert.ok(!dataEditorJs.includes('handleReset'));
  assert.ok(dataEditorWxml.includes('class="editor-actions settings-button-row is-between"'));
  assert.ok(!dataEditorWxml.includes('block-add-button'));
  assert.ok(dataEditorWxml.includes('>新增</button>'));
  assert.ok(dataEditorWxml.includes('>保存</button>'));
  assert.ok(dataEditorWxml.includes('bindtap="handleRemoveActive"'));
  assert.ok(dataEditorWxml.includes('>删除</button>'));
  assert.ok(!dataEditorWxml.includes('>重置</button>'));
  assert.ok(dataEditorWxml.includes('tab-list settings-button-row is-between'));
  assert.ok(dataEditorWxml.includes('settings-button settings-button-action tab-button is-active'));
  assert.ok(dataEditorWxml.includes('settings-button settings-button-action settings-button-neutral tab-button'));
  assert.ok(dataEditorWxml.includes('settings-button settings-button-inline settings-button-secondary'));
  assert.ok(dataEditorWxml.includes('nested-delete-button'));
  assert.ok(!dataEditorWxml.includes('settings-button settings-button-ghost settings-button-danger'));
  assert.ok(!dataEditorWxml.includes('settings-button-segment'));
  assert.ok(!dataEditorWxml.includes('is-segmented'));
  assert.ok(dataEditorWxss.includes('.editor-top'));
  assert.ok(dataEditorWxss.includes('display: grid'));
  assert.ok(dataEditorWxss.includes('justify-content: stretch'));
  assert.ok(dataEditorWxss.includes('line-height: 1.35'));
  assert.ok(dataEditorWxss.includes('.type-list'));
  assert.ok(dataEditorWxss.includes('justify-content: flex-start'));
  assert.ok(dataEditorWxss.includes('.editor-actions'));
  assert.ok(dataEditorWxss.includes('justify-content: space-between'));
  assert.ok(settingsButtonsWxss.includes('.settings-button-row'));
  assert.ok(settingsButtonsWxss.includes('flex-wrap: wrap'));
  assert.ok(settingsButtonsWxss.includes('gap: 16rpx'));
  assert.ok(settingsButtonsWxss.includes('max-width: 100%'));
  assert.ok(settingsButtonsWxss.includes('justify-content: center'));
  assert.ok(!settingsButtonsWxss.includes('justify-content: space-between'));
  assert.ok(!settingsButtonsWxss.includes('.settings-button-row.is-segmented'));
  assert.ok(!settingsButtonsWxss.includes('.settings-button-segment'));
  assert.ok(settingsButtonsWxss.includes('.settings-button'));
  assert.ok(settingsButtonsWxss.includes('border: 1rpx solid var(--resume-border, #d1d5db)'));
  assert.ok(settingsButtonsWxss.includes('border-radius: 8rpx'));
  assert.ok(settingsButtonsWxss.includes('text-align: center'));
  assert.ok(settingsButtonsWxss.includes('white-space: nowrap'));
  assert.ok(settingsButtonsWxss.includes('background: var(--resume-surface, #ffffff)'));
  assert.ok(settingsButtonsWxss.includes('border-color: var(--resume-border, #d1d5db)'));
  assert.ok(settingsButtonsWxss.includes('color: var(--resume-text, #111827)'));
  assert.ok(!settingsButtonsWxss.includes('background: var(--resume-text, #111827)'));
  assert.ok(!settingsButtonsWxss.includes('background: var(--resume-accent-soft, #eef2ff)'));
  assert.ok(!settingsButtonsWxss.includes('background: var(--resume-danger-soft, #fef2f2)'));
  assert.ok(!settingsButtonsWxss.includes('background: transparent'));
  assert.ok(!settingsButtonsWxss.includes('border-color: transparent'));
  assert.ok(!settingsButtonsWxss.includes('border-color: var(--resume-accent'));
  assert.ok(!settingsButtonsWxss.includes('border-color: var(--resume-danger'));
  assert.ok(!settingsButtonsWxss.includes('border-color: var(--resume-text'));
  assert.ok(!settingsButtonsWxss.includes('color: var(--resume-accent'));
  assert.ok(!settingsButtonsWxss.includes('color: var(--resume-danger'));
  assert.ok(settingsButtonsWxss.includes('.settings-button-compact'));
  assert.ok(settingsButtonsWxss.includes('flex: 0 1 116rpx'));
  assert.ok(settingsButtonsWxss.includes('.settings-button-action'));
  assert.ok(settingsButtonsWxss.includes('flex: 1 1 112rpx'));
  assert.ok(settingsButtonsWxss.includes('max-width: 168rpx'));
  assert.ok(settingsButtonsWxss.includes('.settings-button-inline'));
  assert.ok(settingsButtonsWxss.includes('min-width: 180rpx'));
  assert.ok(settingsButtonsWxss.includes('max-width: 260rpx'));
  assert.ok(settingsButtonsWxss.includes('.settings-button-primary'));
  assert.ok(settingsButtonsWxss.includes('.settings-button-secondary'));
  assert.ok(settingsButtonsWxss.includes('.settings-button-danger'));
  assert.ok(settingsButtonsWxss.includes('.settings-button.is-active'));
  assert.ok(dataEditorJs.includes("this.triggerEvent('editresumedata'"));
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
