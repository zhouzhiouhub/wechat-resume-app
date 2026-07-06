Component({
  properties: {
    contact: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleCopyEmail() {
      const contact = this.data.contact || {};

      this.triggerEvent('copyemail', {
        email: contact.email
      });
    },

    handleShowWechatQr() {
      const contact = this.data.contact || {};

      this.triggerEvent('showwechatqr', {
        wechatQr: contact.wechatQr
      });
    }
  }
});
