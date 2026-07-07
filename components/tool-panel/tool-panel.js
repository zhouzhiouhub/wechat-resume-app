Component({
  properties: {
    display: {
      type: Object,
      value: {
        showPoster: true,
        showPrint: true,
        showFeedback: true,
        showCustomerService: true
      }
    }
  },

  methods: {
    handleOpenPoster() {
      this.triggerEvent('openposter');
    },

    handleOpenPrint() {
      this.triggerEvent('openprint');
    },

    handleOpenFeedback() {
      this.triggerEvent('openfeedback');
    }
  }
});
