const resumeData = {
  profile: {
    name: '周珍运',
    avatar: '',
    title: '前端开发工程师',
    status: '寻找机会中',
    summary: '擅长微信小程序、React 和前端工程化，关注性能、体验和可维护性。',
    location: '上海',
    contact: {
      email: 'name@example.com',
      wechatQr: ''
    }
  },
  skillGroups: [
    {
      groupName: '小程序与前端',
      skills: [
        { name: '微信小程序', level: 88, tags: ['组件化', '生命周期', '性能优化'] },
        { name: 'React', level: 85, tags: ['Hooks', '状态管理', '组件设计'] },
        { name: 'JavaScript', level: 86, tags: ['ES6+', '异步流程', '模块化'] }
      ]
    },
    {
      groupName: '工程化',
      skills: [
        { name: '自动化测试', level: 78, tags: ['单元测试', '验证脚本'] },
        { name: '前端性能', level: 80, tags: ['首屏优化', '资源治理'] }
      ]
    }
  ],
  projects: [
    {
      id: 'wechat-resume-app',
      name: '微信简历小程序',
      role: '独立开发',
      cover: '/assets/projects/resume-cover.png',
      screenshots: ['/assets/projects/resume-cover.png'],
      techStack: ['微信小程序', 'JavaScript', '组件化'],
      highlights: ['30 秒首屏信息架构', '统一简历数据源', '可验证的数据模型'],
      challenges: [
        {
          problem: '简历信息容易堆叠，面试官难以快速定位亮点',
          solution: '将首页拆成身份、技能、项目和联系路径，并通过 service 统一组织数据',
          result: '候选人定位、核心技能和代表项目可以在首屏和一次滑动内被看到'
        }
      ],
      metrics: ['首屏展示 3 类核心信息', '核心数据可由验证脚本重复检查']
    },
    {
      id: 'mini-program-activity',
      name: '小程序活动页组件库',
      role: '前端开发',
      cover: '/assets/projects/activity-cover.png',
      screenshots: ['/assets/projects/activity-cover.png'],
      techStack: ['微信小程序', 'WXML', 'WXSS'],
      highlights: ['抽象活动配置模型', '复用 banner 与任务组件'],
      challenges: [
        {
          problem: '活动页频繁变化，重复开发成本高',
          solution: '拆分通用展示组件和配置数据，页面只负责组合渲染',
          result: '新活动页面可通过配置快速搭建，减少重复代码'
        }
      ],
      metrics: ['复用 4 类活动展示模块', '降低活动页重复实现成本']
    }
  ],
  timeline: [
    {
      type: 'work',
      title: '前端开发工程师',
      organization: '个人项目与作品集',
      startDate: '2025-10',
      endDate: '',
      description: '围绕微信小程序、React 和工程化能力沉淀可展示项目，完善组件化、主题和分享能力。'
    },
    {
      type: 'work',
      title: '前端开发实习生',
      organization: '某科技公司',
      startDate: '2025-03',
      endDate: '2025-09',
      description: '负责小程序活动页和后台管理页面开发。'
    },
    {
      type: 'education',
      title: '前端工程化专项学习',
      organization: '个人技术成长计划',
      startDate: '2024-09',
      endDate: '2025-02',
      description: '系统学习 JavaScript、React、自动化测试和性能优化，并以项目实践验证。'
    }
  ]
};

module.exports = resumeData;
