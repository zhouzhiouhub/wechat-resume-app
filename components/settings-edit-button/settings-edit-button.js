Component({
  properties: {
    sectionId: {
      type: String,
      value: ''
    },
    isEditing: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('toggle', {
        sectionId: this.data.sectionId
      });
    }
  }
});
