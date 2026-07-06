const contactService = require('../../services/contactService');
const printResumeService = require('../../services/printResumeService');
const resumeService = require('../../services/resumeService');
const profileAssetService = require('../../services/profileAssetService');
const themeService = require('../../services/themeService');

Page({
  data: {
    themeClass: '',
    printResume: null,
    loadError: ''
  },

  onLoad() {
    this.loadTheme();
    this.loadPrintResume();
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

  loadPrintResume() {
    try {
      const resume = profileAssetService.applyAssetsToResume(
        resumeService.getResume(),
        profileAssetService.readProfileAssets(wx)
      );

      this.setData({
        printResume: printResumeService.createPrintResumeModel(resume),
        loadError: ''
      });
    } catch (error) {
      console.error('[print] failed to load print resume', error);
      this.setData({
        printResume: null,
        loadError: error.message || '打印版数据加载失败'
      });
    }
  },

  onCopyEmail() {
    const printResume = this.data.printResume;

    if (!printResume) {
      return;
    }

    contactService.copyEmail(wx, printResume.contact.email)
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
