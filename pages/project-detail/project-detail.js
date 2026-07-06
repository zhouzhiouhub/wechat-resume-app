const resumeService = require('../../services/resumeService');

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return '';
  }
}

Page({
  data: {
    project: null,
    loadError: ''
  },

  onLoad(options) {
    this.loadProject(options && options.id);
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
