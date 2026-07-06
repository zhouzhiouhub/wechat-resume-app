# resumeData cloud function

统一承接简历小程序的 M5 云能力样例：埋点记录、留言记录、订阅通知、openid 和管理端校验。

## 部署前配置

1. 在微信开发者工具中开通云开发。
2. 将 `config/env.js` 中 `cloud.enabled` 改为 `true`，填写 `cloud.envId`。
3. 在云函数环境变量中配置 `ADMIN_OPENIDS`，多个 openid 用英文逗号分隔。
4. 在云数据库创建集合：
   - `resume_analytics_events`
   - `resume_feedback_records`

## 请求示例

```js
wx.cloud.callFunction({
  name: 'resumeData',
  data: {
    action: 'recordAnalytics',
    data: {
      event: {
        name: 'project_open',
        timestamp: Date.now(),
        payload: {
          projectId: 'wechat-resume-app'
        }
      }
    }
  }
});
```

```js
wx.cloud.callFunction({
  name: 'resumeData',
  data: {
    action: 'submitFeedback',
    data: {
      record: {
        type: 'question',
        content: '想了解项目性能优化细节',
        createdAt: Date.now()
      }
    }
  }
});
```
