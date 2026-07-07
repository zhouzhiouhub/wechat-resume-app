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

    handleInitialSectionChange(event) {
      this.triggerEvent('displaychange', {
        field: 'initialSection',
        value: event.currentTarget.dataset.sectionId
      });
    },

    handleFeaturedProjectCountStep(event) {
      const currentCount = Number(
        this.data.preferenceState
          && this.data.preferenceState.displayDraft
          && this.data.preferenceState.displayDraft.featuredProjectCount
      ) || 3;
      const delta = Number(event.currentTarget.dataset.delta) || 0;

      this.triggerEvent('displaychange', {
        field: 'featuredProjectCount',
        value: currentCount + delta
      });
    },

    handleDisplaySwitchChange(event) {
      this.triggerEvent('displaychange', {
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
