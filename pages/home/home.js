const resumeService = require('../../services/resumeService');
const contactService = require('../../services/contactService');
const resumeSectionService = require('../../services/resumeSectionService');
const themeService = require('../../services/themeService');
const analyticsService = require('../../services/analyticsService');
const authService = require('../../services/authService');
const tapCounter = require('../../utils/tapCounter');

Page({
  data: {
    themeClass: '',
    themeOptions: [],
    activeTheme: '',
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

  loadResume() {
    try {
      const homeResume = resumeService.getHomeResume();
      const sectionState = resumeSectionService.createHomeSectionState();

      this.setData({
        profile: homeResume.profile,
        contact: homeResume.contact,
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

  onChangeTheme(event) {
    const themeId = event.detail && event.detail.themeId;
    const savedThemeId = themeService.saveThemeId(wx, themeId);
    const themeState = themeService.createThemeState(savedThemeId);

    themeService.applyNavigationBar(wx, themeState.activeTheme);
    this.setData(themeState);
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
