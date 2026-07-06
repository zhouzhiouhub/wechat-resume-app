const resumeService = require('../../services/resumeService');
const themeService = require('../../services/themeService');
const analyticsService = require('../../services/analyticsService');
const notificationService = require('../../services/notificationService');

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return '';
  }
}

Page({
  data: {
    themeClass: '',
    project: null,
    loadError: ''
  },

  onLoad(options) {
    this.loadTheme();
    this.loadProject(options && options.id);
  },

  onShow() {
    this.loadTheme();
    this.startStayTimer('project-detail');
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
    this.setData({
      themeClass: themeState.themeClass
    });
  },

  loadProject(projectId) {
    const normalizedProjectId = typeof projectId === 'string'
      ? safeDecode(projectId)
      : '';
    const project = resumeService.getProjectById(normalizedProjectId);

    if (!project) {
      wx.setNavigationBarTitle({
        title: '项目不存在'
      });

      this.setData({
        project: null,
        loadError: '未找到项目详情'
      });
      return;
    }

    wx.setNavigationBarTitle({
      title: project.name
    });

    this.setData({
      project,
      loadError: ''
    });

    this.activeProjectId = project.id;
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.PROJECT_DETAIL_VIEW, {
      projectId: project.id,
      projectName: project.name
    });
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.PAGE_VIEW, {
      page: 'project-detail',
      projectId: project.id
    });
    this.sendProjectNotification(project);
  },

  sendProjectNotification(project) {
    notificationService.sendProjectBrowseNotification(wx, project)
      .then((result) => result)
      .catch(() => null);
  },

  startStayTimer(page) {
    this.analyticsPage = page;
    this.analyticsEnterAt = Date.now();
    this.hasRecordedStay = false;
  },

  recordPageStay() {
    if (!this.analyticsEnterAt || this.hasRecordedStay) {
      return;
    }

    const durationMs = Math.max(Date.now() - this.analyticsEnterAt, 0);

    this.hasRecordedStay = true;
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.PAGE_STAY, {
      page: this.analyticsPage || 'project-detail',
      projectId: this.activeProjectId || '',
      durationMs
    });
  },

  recordAnalyticsEvent(eventName, payload) {
    try {
      analyticsService.recordEvent(wx, eventName, payload);
    } catch (error) {
      console.warn('[project-detail] analytics skipped', error);
    }
  },

  backHome() {
    const pages = getCurrentPages();

    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    wx.redirectTo({
      url: '/pages/home/home'
    });
  }
});
