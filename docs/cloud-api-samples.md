# M5 云能力请求样例

当前前端默认关闭云调用。开启方式：

1. 在 `project.config.json` 确认 `cloudfunctionRoot` 为 `cloudfunctions/`。
2. 在 `config/env.js` 填写 `cloud.envId` 并将 `cloud.enabled` 改为 `true`。
3. 在微信开发者工具中上传并部署 `cloudfunctions/resumeData`。

## 埋点记录

```js
wx.cloud.callFunction({
  name: 'resumeData',
  data: {
    action: 'recordAnalytics',
    data: {
      event: {
        name: 'page_view',
        label: '访问页面',
        timestamp: Date.now(),
        payload: {
          page: 'home'
        }
      }
    }
  }
});
```

## 留言记录

```js
wx.cloud.callFunction({
  name: 'resumeData',
  data: {
    action: 'submitFeedback',
    data: {
      record: {
        type: 'question',
        typeLabel: '问题',
        content: '希望了解项目数据能力实现方式',
        createdAt: Date.now()
      }
    }
  }
});
```

## 管理端校验

```js
wx.cloud.callFunction({
  name: 'resumeData',
  data: {
    action: 'checkAdmin',
    data: {}
  }
});
```

## 订阅通知

```js
wx.cloud.callFunction({
  name: 'resumeData',
  data: {
    action: 'sendNotification',
    data: {
      notification: {
        toUser: 'OPENID',
        templateId: 'TEMPLATE_ID',
        page: 'pages/admin-dashboard/admin-dashboard',
        data: {
          thing1: {
            value: '微信简历小程序'
          },
          time2: {
            value: '2026-07-06 10:00'
          }
        }
      }
    }
  }
});
```
