Component({
  properties: {
    options: {
      type: Array,
      value: [],
      observer(options) {
        this.syncOptions(options);
      }
    }
  },

  data: {
    activeIndex: 0,
    isOpen: false,
    activeOption: {
      label: '请选择主题',
      swatchColor: '#2563eb'
    }
  },

  lifetimes: {
    attached() {
      this.syncOptions(this.data.options);
    }
  },

  methods: {
    syncOptions(options) {
      const normalizedOptions = Array.isArray(options) ? options : [];
      const activeIndex = Math.max(
        normalizedOptions.findIndex((option) => option && option.isActive),
        0
      );

      this.setData({
        activeIndex,
        isOpen: false,
        activeOption: normalizedOptions[activeIndex] || {
          label: '请选择主题',
          swatchColor: '#2563eb'
        }
      });
    },

    onToggleDropdown() {
      this.setData({
        isOpen: !this.data.isOpen
      });
    },

    onSelectTheme(event) {
      const themeId = event.currentTarget.dataset.themeId;
      const normalizedOptions = Array.isArray(this.data.options) ? this.data.options : [];
      const selectedIndex = normalizedOptions.findIndex((option) => option && option.id === themeId);
      const selectedOption = normalizedOptions[selectedIndex];

      if (!selectedOption) {
        return;
      }

      this.setData({
        activeIndex: selectedIndex,
        isOpen: false,
        activeOption: selectedOption
      });

      if (selectedOption.isActive) {
        return;
      }

      this.triggerEvent('change', {
        themeId: selectedOption.id
      });
    }
  }
});
