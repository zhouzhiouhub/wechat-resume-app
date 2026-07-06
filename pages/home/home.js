const resumeService = require('../../services/resumeService');

Page({
  data: {
    profile: null,
    skillHighlights: [],
    skillGroups: [],
    featuredProjects: [],
    loadError: ''
  },

  onLoad() {
    this.loadResume();
  },

  loadResume() {
    try {
      const homeResume = resumeService.getHomeResume();

      this.setData({
        profile: homeResume.profile,
        skillHighlights: homeResume.skillHighlights,
        skillGroups: homeResume.skillGroups,
        featuredProjects: homeResume.featuredProjects,
        loadError: ''
      });
    } catch (error) {
      console.error('[home] failed to load resume data', error);

      this.setData({
        loadError: error.message || '简历数据加载失败'
      });
    }
  }
});
