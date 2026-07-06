const posterService = require('../../services/posterService');
const contactService = require('../../services/contactService');
const resumeService = require('../../services/resumeService');
const profileAssetService = require('../../services/profileAssetService');
const themeService = require('../../services/themeService');
const analyticsService = require('../../services/analyticsService');

Page({
  data: {
    themeClass: '',
    activeTheme: 'light',
    poster: null,
    renderPlan: null,
    posterCanvasId: 'resumePosterCanvas',
    isSavingPoster: false,
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
    const nextData = {
      themeClass: themeState.themeClass,
      activeTheme: themeState.activeTheme
    };

    themeService.applyNavigationBar(wx, themeState.activeTheme);

    if (this.data.poster) {
      nextData.renderPlan = posterService.createPosterRenderPlan(
        this.data.poster,
        themeState.activeTheme
      );
    }

    this.setData(nextData);
  },

  loadPoster() {
    try {
      const resume = profileAssetService.applyAssetsToResume(
        resumeService.getResume(),
        profileAssetService.readProfileAssets(wx)
      );
      const poster = posterService.createPosterModel(resume);

      this.setData({
        poster,
        renderPlan: posterService.createPosterRenderPlan(poster, this.data.activeTheme),
        loadError: ''
      });
    } catch (error) {
      console.error('[poster] failed to load poster model', error);
      this.setData({
        poster: null,
        renderPlan: null,
        loadError: error.message || '海报数据加载失败'
      });
    }
  },

  onSavePoster() {
    if (!this.data.poster || !this.data.renderPlan || this.data.isSavingPoster) {
      return;
    }

    this.setData({
      isSavingPoster: true
    });

    this.drawPosterToCanvas()
      .then(() => this.exportPosterImage())
      .then((tempFilePath) => this.savePosterImage(tempFilePath))
      .then(() => {
        this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.POSTER_SAVE, {
          page: 'poster'
        });
        wx.showToast({
          title: '海报已保存',
          icon: 'success'
        });
      })
      .catch((error) => {
        console.error('[poster] failed to save poster', error);
        wx.showToast({
          title: '保存失败，请检查相册权限',
          icon: 'none'
        });
        this.setData({
          isSavingPoster: false
        });
      })
      .then(() => {
        this.setData({
          isSavingPoster: false
        });
      });
  },

  drawPosterToCanvas() {
    const renderPlan = this.data.renderPlan;
    const context = wx.createCanvasContext(this.data.posterCanvasId, this);

    renderPlan.commands.forEach((command) => {
      this.drawPosterCommand(context, command);
    });

    return new Promise((resolve) => {
      context.draw(false, resolve);
    });
  },

  drawPosterCommand(context, command) {
    if (command.type === 'roundRect') {
      this.drawRoundRect(context, command);
      return;
    }

    if (command.type === 'text') {
      this.drawText(context, command);
      return;
    }

    if (command.type === 'image') {
      context.drawImage(command.src, command.x, command.y, command.width, command.height);
    }
  },

  drawRoundRect(context, command) {
    const radius = Math.min(
      command.radius || 0,
      command.width / 2,
      command.height / 2
    );
    const right = command.x + command.width;
    const bottom = command.y + command.height;

    context.beginPath();
    context.moveTo(command.x + radius, command.y);
    context.lineTo(right - radius, command.y);
    context.arcTo(right, command.y, right, command.y + radius, radius);
    context.lineTo(right, bottom - radius);
    context.arcTo(right, bottom, right - radius, bottom, radius);
    context.lineTo(command.x + radius, bottom);
    context.arcTo(command.x, bottom, command.x, bottom - radius, radius);
    context.lineTo(command.x, command.y + radius);
    context.arcTo(command.x, command.y, command.x + radius, command.y, radius);
    context.closePath();

    if (command.fillColor) {
      context.setFillStyle(command.fillColor);
      context.fill();
    }

    if (command.strokeColor && command.lineWidth) {
      context.setLineWidth(command.lineWidth);
      context.setStrokeStyle(command.strokeColor);
      context.stroke();
    }
  },

  drawText(context, command) {
    context.setFillStyle(command.color);
    context.setFontSize(command.fontSize);
    context.setTextAlign(command.align || 'left');
    context.setTextBaseline('top');

    if (command.fontWeight === 'bold') {
      context.font = `normal bold ${command.fontSize}px sans-serif`;
    } else {
      context.font = `normal normal ${command.fontSize}px sans-serif`;
    }

    if (command.maxWidth) {
      context.fillText(command.text, command.x, command.y, command.maxWidth);
      return;
    }

    context.fillText(command.text, command.x, command.y);
  },

  exportPosterImage() {
    const renderPlan = this.data.renderPlan;

    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvasId: this.data.posterCanvasId,
        width: renderPlan.canvas.width,
        height: renderPlan.canvas.height,
        destWidth: renderPlan.canvas.width * renderPlan.canvas.exportScale,
        destHeight: renderPlan.canvas.height * renderPlan.canvas.exportScale,
        fileType: renderPlan.canvas.fileType,
        quality: renderPlan.canvas.quality,
        success: (result) => resolve(result.tempFilePath),
        fail: reject
      }, this);
    });
  },

  savePosterImage(tempFilePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: resolve,
        fail: reject
      });
    });
  },

  recordAnalyticsEvent(eventName, payload) {
    try {
      analyticsService.recordEvent(wx, eventName, payload);
    } catch (error) {
      console.warn('[poster] analytics skipped', error);
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
