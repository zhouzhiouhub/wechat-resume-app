const resumeService = require('../../services/resumeService');
const themeService = require('../../services/themeService');

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
