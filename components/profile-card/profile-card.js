Component({
  properties: {
    profile: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleAvatarTap() {
      this.triggerEvent('avatartap');
    }
  }
});
