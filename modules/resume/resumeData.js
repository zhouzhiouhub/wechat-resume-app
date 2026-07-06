const resumeData = {
  profile: {
    name: '周珍运',
    avatar: '',
    title: '全栈开发工程师 / 桌面端工具链工程师',
    status: '寻找深圳机会中',
    summary: '具备 2 年软件开发、交付维护与技术支持经验，覆盖 Web 全栈开发、桌面端软件构建发布、Python 自动化、云平台部署和技术支持系统维护。',
    location: '深圳',
    contact: {
      email: '2922188469@qq.com',
      wechatQr: ''
    }
  },
  skillGroups: [
    {
      groupName: 'Web 全栈与前端工程',
      skills: [
        { name: 'Next.js', level: 88, tags: ['多页面站点', '后台系统', 'SEO 基础'] },
        { name: 'React', level: 86, tags: ['组件化', '状态管理', '后台管理'] },
        { name: 'TypeScript', level: 84, tags: ['类型建模', '接口联调', '业务系统'] },
        { name: 'Astro', level: 82, tags: ['官网', '静态站点', '多语言页面'] }
      ]
    },
    {
      groupName: '工具链与自动化',
      skills: [
        { name: 'Python 自动化', level: 86, tags: ['Tkinter', 'openpyxl', 'PyInstaller'] },
        { name: '桌面端发布', level: 84, tags: ['Tauri', 'MSIX', '应用商店'] },
        { name: 'Rust / Tauri', level: 80, tags: ['构建流程', '插件处理', '版本发布'] }
      ]
    },
    {
      groupName: '云平台与业务系统',
      skills: [
        { name: 'Cloudflare', level: 82, tags: ['Pages', 'Workers', 'R2'] },
        { name: 'Linux 运维', level: 80, tags: ['systemd', 'Nginx', '日志排查'] },
        { name: '订阅支付', level: 80, tags: ['Webhook', '订单识别', '权益同步'] },
        { name: 'AI 应用维护', level: 78, tags: ['FastAPI', '知识库', '异步任务'] }
      ]
    }
  ],
  projects: [
    {
      id: 'desktop-release-toolchain',
      name: '桌面端软件打包与发布工具链',
      role: '工具链与交付工程师',
      cover: '/assets/projects/resume-cover.png',
      screenshots: ['/assets/projects/resume-cover.png'],
      techStack: ['Rust', 'Tauri', 'npm scripts', 'Python', 'MSIX'],
      highlights: ['维护桌面端构建发布流程', '支持多版本构建策略', '应用商店发布预检'],
      challenges: [
        {
          problem: '多款桌面端产品的内核编译、前端构建、插件处理和安装包生成流程分散，发布前检查容易遗漏。',
          solution: '梳理 Rust / Tauri、npm 脚本与 Python 自动化脚本组成的构建链路，沉淀版本号、授权校验和商店预检流程。',
          result: '支撑多款桌面端产品持续迭代，覆盖完整版本、精简版本和插件裁剪策略。'
        }
      ],
      metrics: ['支撑多款桌面端产品持续迭代', '覆盖完整/精简/插件裁剪构建策略', '支持应用商店发布流程']
    },
    {
      id: 'website-download-system',
      name: '官网与下载发布系统',
      role: '多站点维护 / 自动化部署',
      cover: '/assets/projects/activity-cover.png',
      screenshots: ['/assets/projects/activity-cover.png'],
      techStack: ['Astro', 'Next.js', 'Cloudflare Pages', 'R2', 'CDN'],
      highlights: ['维护官网和下载站点', '自动化部署与预览验证', '缓存刷新与下载链路校验'],
      challenges: [
        {
          problem: '多品牌官网、下载页、更新日志和多语言页面需要频繁同步，下载入口与缓存状态容易不一致。',
          solution: '使用 Astro / Next.js 和云端部署平台维护静态站点，发布前执行构建检查、预览验证、内容核对和 CDN 缓存刷新。',
          result: '提升内容发布效率，并降低安装包下载、更新提示和静态资源链路的发布风险。'
        }
      ],
      metrics: ['维护多个品牌和产品官网', '覆盖下载页、博客和多语言页面', '支持下载地址配置与缓存刷新']
    },
    {
      id: 'subscription-admin-system',
      name: '用户管理与订阅支付系统',
      role: '业务系统维护',
      cover: '/assets/projects/resume-cover.png',
      screenshots: ['/assets/projects/resume-cover.png'],
      techStack: ['Next.js', 'React', 'TypeScript', 'Ant Design', 'Webhook'],
      highlights: ['生产与 Staging 分离', '用户与权益同步', '支付订阅链路维护'],
      challenges: [
        {
          problem: '注册登录、会话、权限、订阅订单和权益同步链路较长，上线前需要同时关注安全配置和业务闭环。',
          solution: '围绕用户检索、账号状态、会员授权、Checkout、客户门户和 Webhook 回调进行维护，并配合日志监控和幂等处理。',
          result: '保障订阅支付和用户权益同步的发布节奏，降低生产环境变更风险。'
        }
      ],
      metrics: ['支持生产与 Staging 分离部署', '覆盖订阅订单和权益同步链路', '发布前检查登录、验证码和 Session 风险点']
    },
    {
      id: 'python-automation-tools',
      name: 'Python 自动化运营与数据工具',
      role: '自动化工具开发',
      cover: '/assets/projects/activity-cover.png',
      screenshots: ['/assets/projects/activity-cover.png'],
      techStack: ['Python', 'Tkinter', 'openpyxl', 'pywin32', 'PyInstaller'],
      highlights: ['订单汇总桌面工具', '日志下载自动化', '邮箱验证码监听转发'],
      challenges: [
        {
          problem: '订单导出、数据汇总、日志下载和验证码转发依赖人工操作，重复执行成本高且容易遗漏。',
          solution: '开发本地可视化工具与定时脚本，结合 Excel 输出、共享目录、失败重试和任务计划配置提升稳定性。',
          result: '将重复运营操作沉淀为可执行工具和检查方式，减少手动处理成本。'
        }
      ],
      metrics: ['支持本地可视化操作和 EXE 构建', '支持手动运行与 Windows 任务计划', '沉淀日志下载运行检查方式']
    },
    {
      id: 'support-ai-ops',
      name: '技术支持 AI 与运维监控',
      role: 'AI 应用与服务维护',
      cover: '/assets/projects/resume-cover.png',
      screenshots: ['/assets/projects/resume-cover.png'],
      techStack: ['FastAPI', 'PostgreSQL', 'pgvector', 'Redis', 'Celery', 'Nginx'],
      highlights: ['知识库与 AI 回复维护', '系统服务与定时任务', '日志排查与健康监控'],
      challenges: [
        {
          problem: '技术支持系统涉及 AI 回复、知识库召回、异步任务、Nginx 和 systemd 服务，异常定位需要跨多个层面。',
          solution: '维护服务部署信息、定时任务、SSL 证书续签和反馈服务重启流程，通过 journalctl、Nginx 配置和任务日志定位问题。',
          result: '提升技术支持 AI 和监控服务的可维护性，支持问题快速闭环。'
        }
      ],
      metrics: ['覆盖 FastAPI、PostgreSQL、Redis 和 Celery 链路', '维护网站可用性与服务器健康监控', '支持日志、服务状态和配置排查']
    }
  ],
  timeline: [
    {
      type: 'work',
      title: '软件开发 / 工具链与交付工程师',
      organization: '深圳市光宇宙科技有限公司',
      startDate: '2024-06',
      endDate: '',
      description: '负责桌面端软件打包发布、官网与下载链路维护、用户管理与订阅支付系统维护、Python 自动化工具和技术支持系统运维。'
    },
    {
      type: 'education',
      title: '本科 / 人工智能',
      organization: '贵州师范学院',
      startDate: '2020-09',
      endDate: '2024-06',
      description: '系统学习人工智能、编程基础和软件工程相关课程，并在工作中持续补齐 Web 全栈、自动化与云平台部署能力。'
    }
  ]
};

module.exports = resumeData;
