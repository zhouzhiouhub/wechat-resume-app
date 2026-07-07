Component({
  properties: {
    editorState: {
      type: Object,
      value: {}
    },
    isEditing: {
      type: Boolean,
      value: false
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
    ],
    activeSkillGroupIndex: 0,
    activeProjectIndex: 0,
    activeTimelineIndex: 0,
    activeLinkIndex: 0
  },

  methods: {
    handleTabChange(event) {
      this.setData({
        activeTab: event.currentTarget.dataset.tab
      });
    },

    emitEdit(detail) {
      if (!this.data.isEditing) {
        return;
      }

      this.triggerEvent('editresumedata', detail);
    },

    getSafeIndex(value) {
      const index = Number(value);

      return Number.isInteger(index) && index >= 0 ? index : 0;
    },

    setActiveFromDataset(dataset) {
      const section = dataset.selectSection || dataset.section;

      if (section === 'skillGroup' || section === 'skill') {
        this.setData({
          activeSkillGroupIndex: this.getSafeIndex(dataset.groupIndex)
        });
      }

      if (section === 'project' || section === 'challenge') {
        this.setData({
          activeProjectIndex: this.getSafeIndex(dataset.projectIndex)
        });
      }

      if (section === 'timeline') {
        this.setData({
          activeTimelineIndex: this.getSafeIndex(dataset.timelineIndex)
        });
      }

      if (section === 'contactLink') {
        this.setData({
          activeLinkIndex: this.getSafeIndex(dataset.linkIndex)
        });
      }
    },

    handleSelectCard(event) {
      this.setActiveFromDataset(event.currentTarget.dataset);
    },

    handleInput(event) {
      if (!this.data.isEditing) {
        return;
      }

      const dataset = event.currentTarget.dataset;

      this.setActiveFromDataset(dataset);
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
      if (!this.data.isEditing) {
        return;
      }

      const dataset = event.currentTarget.dataset;

      this.setActiveFromDataset({
        section: 'timeline',
        timelineIndex: dataset.timelineIndex
      });
      this.emitEdit({
        action: 'update',
        section: 'timeline',
        timelineIndex: dataset.timelineIndex,
        field: 'type',
        value: dataset.value
      });
    },

    handleContactLinkTypeTap(event) {
      if (!this.data.isEditing) {
        return;
      }

      const dataset = event.currentTarget.dataset;

      this.setActiveFromDataset({
        section: 'contactLink',
        linkIndex: dataset.linkIndex
      });
      this.emitEdit({
        action: 'update',
        section: 'contactLink',
        linkIndex: dataset.linkIndex,
        field: 'type',
        value: dataset.value
      });
    },

    handleContactLinkValueTypeTap(event) {
      if (!this.data.isEditing) {
        return;
      }

      const dataset = event.currentTarget.dataset;

      this.setActiveFromDataset({
        section: 'contactLink',
        linkIndex: dataset.linkIndex
      });
      this.emitEdit({
        action: 'update',
        section: 'contactLink',
        linkIndex: dataset.linkIndex,
        field: 'valueType',
        value: dataset.value
      });
    },

    handleAdd(event) {
      if (!this.data.isEditing) {
        return;
      }

      const dataset = event.currentTarget.dataset;
      const viewData = (this.data.editorState && this.data.editorState.viewData) || {};

      this.setActiveFromDataset(dataset);

      if (dataset.section === 'skillGroup') {
        this.setData({
          activeSkillGroupIndex: (viewData.skillGroups || []).length
        });
      }

      if (dataset.section === 'project') {
        this.setData({
          activeProjectIndex: (viewData.projects || []).length
        });
      }

      if (dataset.section === 'timeline') {
        this.setData({
          activeTimelineIndex: (viewData.timeline || []).length
        });
      }

      if (dataset.section === 'contactLink') {
        this.setData({
          activeLinkIndex: (viewData.contactLinks || []).length
        });
      }

      this.emitEdit({
        action: 'add',
        section: dataset.section,
        groupIndex: dataset.groupIndex,
        projectIndex: dataset.projectIndex
      });
    },

    handleRemove(event) {
      if (!this.data.isEditing) {
        return;
      }

      const dataset = event.currentTarget.dataset;

      this.setActiveFromDataset(dataset);
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

    handleRemoveActive() {
      if (!this.data.isEditing) {
        return;
      }

      const nextIndex = (value) => Math.max(this.getSafeIndex(value) - 1, 0);

      if (this.data.activeTab === 'skills') {
        this.emitEdit({
          action: 'remove',
          section: 'skillGroup',
          groupIndex: this.data.activeSkillGroupIndex
        });
        this.setData({
          activeSkillGroupIndex: nextIndex(this.data.activeSkillGroupIndex)
        });
      }

      if (this.data.activeTab === 'projects') {
        this.emitEdit({
          action: 'remove',
          section: 'project',
          projectIndex: this.data.activeProjectIndex
        });
        this.setData({
          activeProjectIndex: nextIndex(this.data.activeProjectIndex)
        });
      }

      if (this.data.activeTab === 'timeline') {
        this.emitEdit({
          action: 'remove',
          section: 'timeline',
          timelineIndex: this.data.activeTimelineIndex
        });
        this.setData({
          activeTimelineIndex: nextIndex(this.data.activeTimelineIndex)
        });
      }

      if (this.data.activeTab === 'links') {
        this.emitEdit({
          action: 'remove',
          section: 'contactLink',
          linkIndex: this.data.activeLinkIndex
        });
        this.setData({
          activeLinkIndex: nextIndex(this.data.activeLinkIndex)
        });
      }
    },

    handleSave() {
      if (!this.data.isEditing) {
        return;
      }

      this.triggerEvent('saveresumedata');
    }
  }
});
