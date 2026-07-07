Component({
  properties: {
    assetState: {
      type: Object,
      value: {}
    },
    isEditing: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleSelectAsset(event) {
      if (!this.data.isEditing) {
        return;
      }

      this.triggerEvent('selectasset', {
        field: event.currentTarget.dataset.field
      });
    },

    handleClearAsset(event) {
      if (!this.data.isEditing) {
        return;
      }

      this.triggerEvent('clearasset', {
        field: event.currentTarget.dataset.field
      });
    }
  }
});
