Component({
  properties: {
    options: {
      type: Array,
      value: []
    }
  },

  methods: {
    handleChange(event) {
      const themeId = event.currentTarget.dataset.themeId;

      this.triggerEvent('change', {
        themeId
      });
    }
  }
});
