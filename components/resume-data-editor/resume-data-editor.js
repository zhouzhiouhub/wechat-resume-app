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
      { id: 'timeline', label: '履历' }
    ],
    timelineTypes: [
      { id: 'work', label: '工作' },
      { id: 'education', label: '教育' },
      { id: 'internship', label: '实习' },
      { id: 'project', label: '项目' }
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
        timelineIndex: dataset.timelineIndex
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
