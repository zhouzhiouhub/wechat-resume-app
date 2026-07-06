const resumeService = require('../../services/resumeService');
const contactService = require('../../services/contactService');
const resumeSectionService = require('../../services/resumeSectionService');
const themeService = require('../../services/themeService');

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
    loadError: ''
  },

  onLoad() {
    this.loadTheme();
    this.loadResume();
  },

  onShow() {
    this.loadTheme();
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

    wx.navigateTo({
      url: `/pages/project-detail/project-detail?id=${encodeURIComponent(projectId)}`
    });
  },

  onCopyEmail(event) {
    const email = event.detail && event.detail.email;

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

    contactService.previewWechatQr(wx, wechatQr)
      .catch(() => {
        wx.showToast({
          title: '微信二维码待补充',
          icon: 'none'
        });
      });
  },

  onOpenPoster() {
    wx.navigateTo({
      url: '/pages/poster/poster'
    });
  }
});
