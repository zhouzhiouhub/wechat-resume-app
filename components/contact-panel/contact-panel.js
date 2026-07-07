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
    },

    handleCallPhone() {
      const contact = this.data.contact || {};

      this.triggerEvent('callphone', {
        phone: contact.phone
      });
    },

    handleCopyLink(event) {
      const contact = this.data.contact || {};
      const links = Array.isArray(contact.links) ? contact.links : [];
      const link = links[event.currentTarget.dataset.linkIndex] || {};

      this.triggerEvent('copylink', {
        name: link.name,
        value: link.value,
        valueType: link.valueType
      });
    }
  }
});
