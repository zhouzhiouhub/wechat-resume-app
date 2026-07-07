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
      wechatQr: ''
    }
  },
  skillGroups: [
    {
      groupName: '核心技能',
      skills: [
        { name: '技能一', level: 80, tags: ['标签一', '标签二'] },
        { name: '技能二', level: 75, tags: ['标签一', '标签二'] },
        { name: '技能三', level: 70, tags: ['标签一', '标签二'] }
      ]
    },
    {
      groupName: '工程能力',
      skills: [
        { name: '项目交付', level: 78, tags: ['需求分析', '迭代管理'] },
        { name: '问题排查', level: 76, tags: ['日志分析', '稳定性'] }
      ]
    }
  ],
  projects: [
    {
      id: 'sample-project-one',
      name: '示例项目一',
      role: '项目角色待填写',
      cover: '/assets/projects/resume-cover.jpg',
      screenshots: ['/assets/projects/resume-cover.jpg'],
      techStack: ['技术一', '技术二', '技术三'],
      highlights: ['项目亮点一', '项目亮点二', '项目亮点三'],
      challenges: [
        {
          problem: '这里填写项目中遇到的核心问题。',
          solution: '这里填写你的解决方案和关键动作。',
          result: '这里填写最终成果、数据或业务价值。'
        }
      ],
      metrics: ['成果一待填写', '成果二待填写', '成果三待填写']
    },
    {
      id: 'sample-project-two',
      name: '示例项目二',
      role: '项目角色待填写',
      cover: '/assets/projects/activity-cover.jpg',
      screenshots: ['/assets/projects/activity-cover.jpg'],
      techStack: ['技术一', '技术二', '技术三'],
      highlights: ['项目亮点一', '项目亮点二', '项目亮点三'],
      challenges: [
        {
          problem: '这里填写另一个项目中的关键挑战。',
          solution: '这里填写你如何拆解问题并推进落地。',
          result: '这里填写交付结果和可验证影响。'
        }
      ],
      metrics: ['成果一待填写', '成果二待填写', '成果三待填写']
    }
  ],
  timeline: [
    {
      type: 'work',
      title: '工作经历待填写',
      organization: '组织或公司待填写',
      startDate: '2024-01',
      endDate: '',
      description: '这里填写最近一段工作、实习或项目经历。'
    },
    {
      type: 'education',
      title: '教育经历待填写',
      organization: '学校或机构待填写',
      startDate: '2020-09',
      endDate: '2024-06',
      description: '这里填写教育背景、专业方向或相关课程。'
    }
  ]
};

module.exports = resumeData;
