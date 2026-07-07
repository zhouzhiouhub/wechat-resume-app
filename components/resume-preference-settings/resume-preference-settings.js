Component({
  properties: {
    preferenceState: {
      type: Object,
      value: {}
    },
    isEditing: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleProfileInput(event) {
      if (!this.data.isEditing) {
        return;
      }

      this.triggerEvent('profileinput', {
        field: event.currentTarget.dataset.field,
        value: event.detail.value
      });
    },

    handleSave() {
      if (!this.data.isEditing) {
        return;
      }

      this.triggerEvent('savepreferences');
    },

    handleReset() {
      if (!this.data.isEditing) {
        return;
      }

      this.triggerEvent('resetpreferences');
    }
  }
});
