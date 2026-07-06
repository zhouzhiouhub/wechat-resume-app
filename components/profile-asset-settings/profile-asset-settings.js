Component({
  properties: {
    assetState: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleSelectAsset(event) {
      this.triggerEvent('selectasset', {
        field: event.currentTarget.dataset.field
      });
    },

    handleClearAsset(event) {
      this.triggerEvent('clearasset', {
        field: event.currentTarget.dataset.field
      });
    }
  }
});
