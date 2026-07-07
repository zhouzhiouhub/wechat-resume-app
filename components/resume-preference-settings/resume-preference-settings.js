Component({
  properties: {
    preferenceState: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleProfileInput(event) {
      this.triggerEvent('profileinput', {
        field: event.currentTarget.dataset.field,
        value: event.detail.value
      });
    },

    handleSave() {
      this.triggerEvent('savepreferences');
    },

    handleReset() {
      this.triggerEvent('resetpreferences');
    }
  }
});
