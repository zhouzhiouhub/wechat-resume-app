const contactService = require('../../services/contactService');
const resumeSectionService = require('../../services/resumeSectionService');
const themeService = require('../../services/themeService');
const analyticsService = require('../../services/analyticsService');
const authService = require('../../services/authService');
const profileAssetService = require('../../services/profileAssetService');
const localResumeDataService = require('../../services/localResumeDataService');
const resumeDataEditorService = require('../../services/resumeDataEditorService');
const resumePreferenceService = require('../../services/resumePreferenceService');
const resumeCustomizationService = require('../../services/resumeCustomizationService');
const settingsAutosaveService = require('../../services/settingsAutosaveService');
const tapCounter = require('../../utils/tapCounter');

Page({
  data: {
    themeClass: '',
    themeOptions: [],
    activeTheme: '',
    settingsEditState: {
      profile: false,
      content: false
    },
    profileAssetState: profileAssetService.createProfileAssetState(null),
    preferenceState: resumePreferenceService.createPreferenceStateFromDraft({}, {}),
    resumeDataState: resumeDataEditorService.createEditorState(),
    displayPreferences: resumePreferenceService.DISPLAY_DEFAULTS,
    profile: null,
    contact: null,
    skillHighlights: [],
    skillGroups: [],
    featuredProjects: [],
    featuredProjectCount: 0,
    timelineItems: [],
    sections: [],
    activeSection: resumeSectionService.DEFAULT_HOME_SECTION_ID,
    activeSectionTitle: '',
    activeSectionMeta: '',
    isAllContent: true,
    isMenuVisible: false,
    showProfile: true,
    showSkills: true,
    showProjects: true,
    showTimeline: true,
    showContact: true,
    showTools: true,
    showSettings: false,
    loadError: ''
  },

  onLoad() {
    this.avatarTapState = tapCounter.createTapState();
    this.loadTheme();
    this.loadResume();
  },

  onShow() {
    this.loadTheme();
    this.startAnalyticsSession('home');
  },

  onHide() {
    this.recordPageStay();
  },

  onUnload() {
    this.recordPageStay();
  },

  loadTheme() {
    const themeState = themeService.createThemeState(themeService.loadThemeId(wx));

    themeService.applyNavigationBar(wx, themeState.activeTheme);
    this.setData(themeState);
  },

  loadResume(activeSectionId) {
    try {
      const homeResume = resumeCustomizationService.getHomeResume(wx);
      const sectionState = resumeSectionService.createHomeSectionState(
        activeSectionId || homeResume.displayPreferences.initialSection
      );

      this.setData({
        profile: homeResume.profile,
        contact: homeResume.contact,
        displayPreferences: homeResume.displayPreferences,
        preferenceState: resumePreferenceService.createPreferenceState(
          homeResume.baseResume,
          homeResume.preferences
        ),
        resumeDataState: resumeDataEditorService.createEditorState(homeResume.resumeDataState),
        profileAssetState: profileAssetService.createProfileAssetState(
          homeResume.resume.profile,
          homeResume.profileAssets
        ),
        skillHighlights: homeResume.skillHighlights,
        skillGroups: homeResume.skillGroups,
        featuredProjects: homeResume.featuredProjects,
        featuredProjectCount: homeResume.featuredProjects.length,
        timelineItems: homeResume.timeline,
        ...sectionState,
        loadError: ''
      });
    } catch (error) {
      console.error('[home] failed to load resume data', error);

      this.setData({
        loadError: error.message || '简历数据加载失败'
      });
    }
  },

  refreshResumeCustomization() {
    this.loadResume(this.data.activeSection);
  },

  startAnalyticsSession(page) {
    this.analyticsPage = page;
    this.analyticsEnterAt = Date.now();
    this.hasRecordedStay = false;
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.PAGE_VIEW, {
      page
    });
  },

  recordPageStay() {
    if (!this.analyticsEnterAt || this.hasRecordedStay) {
      return;
    }

    const durationMs = Math.max(Date.now() - this.analyticsEnterAt, 0);

    this.hasRecordedStay = true;
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.PAGE_STAY, {
      page: this.analyticsPage || 'home',
      durationMs
    });
  },

  recordAnalyticsEvent(eventName, payload) {
    try {
      analyticsService.recordEvent(wx, eventName, payload);
    } catch (error) {
      console.warn('[home] analytics skipped', error);
    }
  },

  onSelectSection(event) {
    const sectionId = event.currentTarget.dataset.sectionId;
    const sectionState = resumeSectionService.createHomeSectionState(sectionId);

    this.setData({
      ...sectionState,
      isMenuVisible: false
    });
  },

  onToggleMenu() {
    this.setData({
      isMenuVisible: !this.data.isMenuVisible
    });
  },

  onHideMenu() {
    this.setData({
      isMenuVisible: false
    });
  },

  canEditSetting(sectionId) {
    const settingsEditState = this.data.settingsEditState || {};

    return Boolean(settingsEditState[sectionId]);
  },

  closeSettingEditor(sectionId) {
    this.setData({
      settingsEditState: {
        ...(this.data.settingsEditState || {}),
        [sectionId]: false
      }
    });
  },

  onToggleSettingsEdit(event) {
    const sectionId = event.detail && event.detail.sectionId;

    if (!sectionId) {
      return;
    }

    const isClosingEditor = this.canEditSetting(sectionId);

    this.setData({
      settingsEditState: {
        ...(this.data.settingsEditState || {}),
        [sectionId]: !this.canEditSetting(sectionId)
      }
    });

    if (isClosingEditor) {
      this.refreshResumeCustomization();
    }
  },

  onChangeTheme(event) {
    const themeId = event.detail && event.detail.themeId;
    const savedThemeId = themeService.saveThemeId(wx, themeId);
    const themeState = themeService.createThemeState(savedThemeId);

    themeService.applyNavigationBar(wx, themeState.activeTheme);
    this.setData(themeState);
  },

  onPreferenceProfileInput(event) {
    if (!this.canEditSetting('profile')) {
      return;
    }

    const field = event.detail && event.detail.field;
    const value = event.detail && event.detail.value;
    const preferenceState = this.data.preferenceState || {};
    const profileDraft = {
      ...(preferenceState.profileDraft || {}),
      [field]: value
    };
    const nextPreferenceState = resumePreferenceService.createPreferenceStateFromDraft(
      profileDraft,
      preferenceState.displayDraft
    );

    this.setData({
      preferenceState: nextPreferenceState
    });
    this.saveProfileSettingsDraft(nextPreferenceState, {
      silent: true
    });
  },

  saveProfileSettingsDraft(preferenceState, options = {}) {
    try {
      const result = settingsAutosaveService.saveProfileSettingsDraft(wx, preferenceState);

      if (options.refresh) {
        this.refreshResumeCustomization();
      }

      return result;
    } catch (error) {
      if (!options.silent) {
        wx.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        });
      }

      return null;
    }
  },

  onSaveResumePreferences() {
    if (!this.canEditSetting('profile')) {
      wx.showToast({
        title: '请先点击编辑',
        icon: 'none'
      });
      return;
    }

    const result = this.saveProfileSettingsDraft(this.data.preferenceState, {
      refresh: true
    });

    if (!result) {
      return;
    }

    this.closeSettingEditor('profile');
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
  },

  onResetResumePreferences() {
    if (!this.canEditSetting('profile')) {
      wx.showToast({
        title: '请先点击编辑',
        icon: 'none'
      });
      return;
    }

    resumePreferenceService.clearResumePreferences(wx);
    this.refreshResumeCustomization();
    this.closeSettingEditor('profile');
    wx.showToast({
      title: '已恢复',
      icon: 'success'
    });
  },

  syncProfilePreferencesFromResumeData(resumeData) {
    settingsAutosaveService.syncProfilePreferencesFromResumeData(wx, resumeData);
  },

  onEditResumeData(event) {
    if (!this.canEditSetting('content')) {
      return;
    }

    const nextResumeDataState = resumeDataEditorService.applyEdit(
      this.data.resumeDataState,
      event.detail
    );

    this.setData({
      resumeDataState: nextResumeDataState
    });
    this.saveResumeContentDraft(nextResumeDataState, {
      silent: true
    });
  },

  updateResumeDataSavedStatus(resumeDataState, payload) {
    const savedState = localResumeDataService.createResumeDataState(payload.resumeData, {
      hasLocalData: true,
      updatedAt: payload.updatedAt
    });

    this.setData({
      resumeDataState: {
        ...resumeDataState,
        hasLocalData: true,
        updatedAt: payload.updatedAt,
        statusText: savedState.statusText
      }
    });
  },

  saveResumeContentDraft(resumeDataState, options = {}) {
    try {
      const result = settingsAutosaveService.saveResumeContentDraft(wx, resumeDataState);

      if (options.updateStatus !== false) {
        this.updateResumeDataSavedStatus(resumeDataState, result.payload);
      }

      if (options.refresh) {
        this.refreshResumeCustomization();
      }

      return result;
    } catch (error) {
      if (!options.silent) {
        wx.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        });
      }

      return null;
    }
  },

  onSaveResumeData() {
    if (!this.canEditSetting('content')) {
      wx.showToast({
        title: '请先点击编辑',
        icon: 'none'
      });
      return;
    }

    const result = this.saveResumeContentDraft(this.data.resumeDataState, {
      refresh: true,
      updateStatus: false
    });

    if (!result) {
      return;
    }

    this.closeSettingEditor('content');
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
  },

  onResetResumeData() {
    if (!this.canEditSetting('content')) {
      wx.showToast({
        title: '请先点击编辑',
        icon: 'none'
      });
      return;
    }

    try {
      const resumeData = localResumeDataService.clearResumeData(wx);

      this.syncProfilePreferencesFromResumeData(resumeData);
      this.refreshResumeCustomization();
      this.closeSettingEditor('content');
      wx.showToast({
        title: '已恢复模板',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '恢复失败',
        icon: 'none'
      });
    }
  },

  onSelectProfileAsset(event) {
    const field = event.detail && event.detail.field;

    profileAssetService.chooseAndSaveProfileAsset(wx, field)
      .then(() => {
        this.refreshResumeCustomization();
        wx.showToast({
          title: '已选择',
          icon: 'success'
        });
      })
      .catch(() => {
        wx.showToast({
          title: '未选择图片',
          icon: 'none'
        });
      });
  },

  onClearProfileAsset(event) {
    const field = event.detail && event.detail.field;

    try {
      profileAssetService.clearProfileAsset(wx, field);

      this.refreshResumeCustomization();
      wx.showToast({
        title: '已清除',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '清除失败',
        icon: 'none'
      });
    }
  },

  onOpenProject(event) {
    const projectId = event.detail && event.detail.id;

    if (!projectId) {
      return;
    }

    const project = (this.data.featuredProjects || [])
      .find((item) => item.id === projectId) || {};

    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.PROJECT_OPEN, {
      projectId,
      projectName: project.name || ''
    });

    wx.navigateTo({
      url: `/pages/project-detail/project-detail?id=${encodeURIComponent(projectId)}`
    });
  },

  onCopyEmail(event) {
    const email = event.detail && event.detail.email;

    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.CONTACT_COPY, {
      page: 'home'
    });

    contactService.copyEmail(wx, email)
      .then(() => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      })
      .catch(() => {
        wx.showToast({
          title: '复制失败，请稍后再试',
          icon: 'none'
        });
      });
  },

  onCopyPhone(event) {
    const phone = event.detail && event.detail.phone;

    if (!phone) {
      wx.showToast({
        title: '手机号待补充',
        icon: 'none'
      });
      return;
    }

    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.CONTACT_COPY, {
      page: 'home',
      field: 'phone'
    });

    contactService.copyText(wx, phone)
      .then(() => {
        wx.showToast({
          title: '手机号已复制',
          icon: 'success'
        });
      })
      .catch(() => {
        wx.showToast({
          title: '复制失败，请稍后再试',
          icon: 'none'
        });
      });
  },

  onCopyContactLink(event) {
    const value = event.detail && event.detail.value;

    contactService.copyText(wx, value)
      .then(() => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        });
      })
      .catch(() => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      });
  },

  onShowWechatQr(event) {
    const wechatQr = event.detail && event.detail.wechatQr;

    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.CONTACT_QR, {
      page: 'home',
      hasQr: Boolean(wechatQr)
    });

    contactService.previewWechatQr(wx, wechatQr)
      .catch(() => {
        wx.showToast({
          title: '微信二维码待补充',
          icon: 'none'
        });
      });
  },

  onOpenPoster() {
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.POSTER_OPEN, {
      page: 'home'
    });

    wx.navigateTo({
      url: '/pages/poster/poster'
    });
  },

  onOpenPrint() {
    wx.navigateTo({
      url: '/pages/print/print'
    });
  },

  onOpenFeedback() {
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.FEEDBACK_OPEN, {
      page: 'home'
    });

    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  onAvatarTap() {
    this.avatarTapState = tapCounter.recordTap(this.avatarTapState, Date.now());

    if (!this.avatarTapState.isTriggered) {
      return;
    }

    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.ADMIN_OPEN, {
      source: 'avatar_hidden_tap'
    });
    authService.grantAdminAccess(wx, {
      source: 'avatar_hidden_tap'
    });

    wx.navigateTo({
      url: '/pages/admin-dashboard/admin-dashboard'
    });
  }
});
