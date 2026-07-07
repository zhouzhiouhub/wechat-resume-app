Component({
  properties: {
    editorState: {
      type: Object,
      value: {}
    }
  },

  data: {
    activeTab: 'skills',
    tabs: [
      { id: 'skills', label: '技能' },
      { id: 'projects', label: '项目' },
      { id: 'timeline', label: '履历' },
      { id: 'links', label: '资料' }
    ],
    timelineTypes: [
      { id: 'work', label: '工作' },
      { id: 'education', label: '教育' },
      { id: 'internship', label: '实习' },
      { id: 'project', label: '项目' }
    ],
    contactLinkTypes: [
      { id: 'code', label: '代码主页' },
      { id: 'blog', label: '个人博客' },
      { id: 'portfolio', label: '作品集' },
      { id: 'social', label: '社交账号' },
      { id: 'certificate', label: '证书' },
      { id: 'other', label: '其他' }
    ],
    contactLinkValueTypes: [
      { id: 'url', label: '链接' },
      { id: 'text', label: '文本' }
    ]
  },

  methods: {
    handleTabChange(event) {
      this.setData({
        activeTab: event.currentTarget.dataset.tab
      });
    },

    emitEdit(detail) {
      this.triggerEvent('editresumedata', detail);
    },

    handleInput(event) {
      const dataset = event.currentTarget.dataset;

      this.emitEdit({
        action: 'update',
        section: dataset.section,
        groupIndex: dataset.groupIndex,
        skillIndex: dataset.skillIndex,
        projectIndex: dataset.projectIndex,
        challengeIndex: dataset.challengeIndex,
        timelineIndex: dataset.timelineIndex,
        linkIndex: dataset.linkIndex,
        field: dataset.field,
        value: event.detail.value
      });
    },

    handleTypeTap(event) {
      const dataset = event.currentTarget.dataset;

      this.emitEdit({
        action: 'update',
        section: 'timeline',
        timelineIndex: dataset.timelineIndex,
        field: 'type',
        value: dataset.value
      });
    },

    handleContactLinkTypeTap(event) {
      const dataset = event.currentTarget.dataset;

      this.emitEdit({
        action: 'update',
        section: 'contactLink',
        linkIndex: dataset.linkIndex,
        field: 'type',
        value: dataset.value
      });
    },

    handleContactLinkValueTypeTap(event) {
      const dataset = event.currentTarget.dataset;

      this.emitEdit({
        action: 'update',
        section: 'contactLink',
        linkIndex: dataset.linkIndex,
        field: 'valueType',
        value: dataset.value
      });
    },

    handleAdd(event) {
      const dataset = event.currentTarget.dataset;

      this.emitEdit({
        action: 'add',
        section: dataset.section,
        groupIndex: dataset.groupIndex,
        projectIndex: dataset.projectIndex
      });
    },

    handleRemove(event) {
      const dataset = event.currentTarget.dataset;

      this.emitEdit({
        action: 'remove',
        section: dataset.section,
        groupIndex: dataset.groupIndex,
        skillIndex: dataset.skillIndex,
        projectIndex: dataset.projectIndex,
        challengeIndex: dataset.challengeIndex,
        timelineIndex: dataset.timelineIndex,
        linkIndex: dataset.linkIndex
      });
    },

    handleSave() {
      this.triggerEvent('saveresumedata');
    },

    handleReset() {
      this.triggerEvent('resetresumedata');
    }
  }
});
