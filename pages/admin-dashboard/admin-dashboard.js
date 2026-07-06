const analyticsService = require('../../services/analyticsService');
const authService = require('../../services/authService');
const feedbackService = require('../../services/feedbackService');
const themeService = require('../../services/themeService');

function createMetricCards(metrics, feedbackSummary) {
  return [
    {
      id: 'visits',
      label: '访问量',
      value: metrics.totalVisits,
      meta: '页面访问'
    },
    {
      id: 'project',
      label: '项目点击',
      value: metrics.projectClickCount,
      meta: '首页卡片'
    },
    {
      id: 'stay',
      label: '平均停留',
      value: `${metrics.averageStaySeconds}s`,
      meta: '页面停留'
    },
    {
      id: 'contact',
      label: '联系点击',
      value: metrics.contactClickCount,
      meta: '联系动作'
    },
    {
      id: 'feedback',
      label: '留言数',
      value: feedbackSummary.total,
      meta: '访客反馈'
    },
    {
      id: 'events',
      label: '事件数',
      value: metrics.totalEvents,
      meta: '本地记录'
    }
  ];
}

Page({
  data: {
    themeClass: '',
    metricCards: [],
    topProjects: [],
    recentEvents: [],
    feedbackSummary: feedbackService.getFeedbackSummary([]),
    latestFeedback: [],
    isAuthorized: false,
    guardReason: '',
    loadError: ''
  },

  onLoad() {
    this.loadTheme();
    if (!this.ensureAdminAccess()) {
      return;
    }
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.ADMIN_OPEN, {
      source: 'dashboard_load'
    });
    this.loadDashboard();
  },

  onShow() {
    this.loadTheme();
    if (!this.ensureAdminAccess()) {
      return;
    }
    this.loadDashboard();
  },

  loadTheme() {
    const themeState = themeService.createThemeState(themeService.loadThemeId(wx));

    themeService.applyNavigationBar(wx, themeState.activeTheme);
    this.setData({
      themeClass: themeState.themeClass
    });
  },

  ensureAdminAccess() {
    const guardState = authService.getAdminGuardState(wx);

    this.setData({
      isAuthorized: guardState.isAuthorized,
      guardReason: guardState.reason
    });

    return guardState.isAuthorized;
  },

  loadDashboard() {
    if (!this.data.isAuthorized) {
      return;
    }

    try {
      const dashboardState = analyticsService.createDashboardState(wx);
      const feedbackRecords = feedbackService.readFeedback(wx);
      const feedbackSummary = feedbackService.getFeedbackSummary(feedbackRecords);

      this.setData({
        metricCards: createMetricCards(dashboardState.metrics, feedbackSummary),
        topProjects: dashboardState.metrics.topProjects,
        recentEvents: dashboardState.metrics.recentEvents,
        feedbackSummary,
        latestFeedback: feedbackSummary.latest,
        loadError: ''
      });
    } catch (error) {
      console.error('[admin-dashboard] failed to load dashboard', error);
      this.setData({
        loadError: error.message || '数据看板加载失败'
      });
    }
  },

  recordAnalyticsEvent(eventName, payload) {
    try {
      analyticsService.recordEvent(wx, eventName, payload);
    } catch (error) {
      console.warn('[admin-dashboard] analytics skipped', error);
    }
  },

  onRefresh() {
    if (!this.ensureAdminAccess()) {
      return;
    }

    this.loadDashboard();
    wx.showToast({
      title: '已刷新',
      icon: 'success'
    });
  },

  onClearData() {
    if (!this.ensureAdminAccess()) {
      return;
    }

    wx.showModal({
      title: '清空数据',
      content: '确认清空当前看板数据？',
      success: (result) => {
        if (!result.confirm) {
          return;
        }

        analyticsService.clearEvents(wx);
        feedbackService.clearFeedback(wx);
        this.loadDashboard();
        wx.showToast({
          title: '已清空',
          icon: 'success'
        });
      }
    });
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
