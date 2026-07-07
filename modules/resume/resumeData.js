const resumeData = {
  profile: {
    name: '未设置姓名',
    avatar: '',
    title: '待填写职业定位',
    status: '待完善简历',
    summary: '请在设置中维护个人简介、技能、项目和履历内容。数据会保存在当前微信用户的本机缓存中。',
    location: '待填写城市',
    contact: {
      email: 'user@example.com',
      phone: '13800000000',
      wechatQr: ''
    }
  },
  skillGroups: [
    {
      groupName: '技能组模板',
      skills: [
        { name: '技能模板', level: 70, tags: ['标签模板'] }
      ]
    }
  ],
  projects: [
    {
      id: 'sample-project-template',
      name: '项目模板',
      role: '项目角色待填写',
      cover: '/assets/projects/resume-cover.jpg',
      screenshots: ['/assets/projects/resume-cover.jpg'],
      techStack: ['技术模板'],
      highlights: ['项目亮点模板'],
      challenges: [
        {
          problem: '这里填写项目中遇到的核心问题。',
          solution: '这里填写你的解决方案和关键动作。',
          result: '这里填写最终成果、数据或业务价值。'
        }
      ],
      metrics: ['成果模板']
    }
  ],
  timeline: [
    {
      type: 'work',
      title: '履历模板',
      organization: '组织或公司待填写',
      startDate: '2024-01',
      endDate: '',
      description: '这里填写最近一段工作、实习或项目经历。'
    }
  ]
};

module.exports = resumeData;
