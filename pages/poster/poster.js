const posterService = require('../../services/posterService');
const contactService = require('../../services/contactService');
const themeService = require('../../services/themeService');

Page({
  data: {
    themeClass: '',
    poster: null,
    loadError: ''
  },

  onLoad() {
    this.loadTheme();
    this.loadPoster();
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

  loadPoster() {
    try {
      this.setData({
        poster: posterService.getPosterModel(),
        loadError: ''
      });
    } catch (error) {
      console.error('[poster] failed to load poster model', error);
      this.setData({
        poster: null,
        loadError: error.message || '海报数据加载失败'
      });
    }
  },

  onCopyEmail() {
    const poster = this.data.poster;

    if (!poster) {
      return;
    }

    contactService.copyEmail(wx, poster.contact.email)
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
