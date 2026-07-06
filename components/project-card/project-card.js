Component({
  properties: {
    project: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleOpen() {
      const project = this.data.project || {};

      this.triggerEvent('open', {
        id: project.id
      });
    }
  }
});
