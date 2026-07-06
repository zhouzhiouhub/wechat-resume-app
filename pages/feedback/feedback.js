const analyticsService = require('../../services/analyticsService');
const feedbackService = require('../../services/feedbackService');
const themeService = require('../../services/themeService');

Page({
  data: {
    themeClass: '',
    form: feedbackService.createFeedbackForm(),
    typeOptions: feedbackService.getFeedbackTypeOptions(),
    errors: [],
    isSubmitting: false
  },

  onLoad() {
    this.loadTheme();
    this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.PAGE_VIEW, {
      page: 'feedback'
    });
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

  setFormValue(fieldName, value) {
    this.setData({
      form: {
        ...this.data.form,
        [fieldName]: value
      },
      errors: []
    });
  },

  onSelectType(event) {
    const type = event.currentTarget.dataset.type;

    this.setData({
      form: {
        ...this.data.form,
        type
      },
      typeOptions: feedbackService.getFeedbackTypeOptions(type),
      errors: []
    });
  },

  onInputName(event) {
    this.setFormValue('name', event.detail.value);
  },

  onInputContact(event) {
    this.setFormValue('contact', event.detail.value);
  },

  onInputContent(event) {
    this.setFormValue('content', event.detail.value);
  },

  onSubmitFeedback() {
    if (this.data.isSubmitting) {
      return;
    }

    const validation = feedbackService.validateFeedbackInput(this.data.form);

    if (!validation.isValid) {
      this.setData({
        errors: validation.errors
      });
      wx.showToast({
        title: validation.errors[0],
        icon: 'none'
      });
      return;
    }

    this.setData({
      isSubmitting: true
    });

    try {
      const record = feedbackService.submitFeedback(wx, validation.value);

      this.recordAnalyticsEvent(analyticsService.EVENT_NAMES.FEEDBACK_SUBMIT, {
        feedbackType: record.type
      });
      this.setData({
        form: feedbackService.createFeedbackForm(record.type),
        typeOptions: feedbackService.getFeedbackTypeOptions(record.type),
        errors: []
      });
      wx.showToast({
        title: '已收到',
        icon: 'success'
      });
    } catch (error) {
      this.setData({
        errors: [error.message || '提交失败']
      });
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      });
    }

    this.setData({
      isSubmitting: false
    });
  },

  recordAnalyticsEvent(eventName, payload) {
    try {
      analyticsService.recordEvent(wx, eventName, payload);
    } catch (error) {
      console.warn('[feedback] analytics skipped', error);
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
