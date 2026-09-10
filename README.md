# iOS 签名安装中心

一个现代化的 iOS 应用签名分发前端页面，支持设备 UDID 自动获取、兑换码校验、IPA 一键安装。

## ✨ 功能特性

- 📱 **设备UDID自动获取** - 通过安装描述文件自动识别设备，无需手动输入
- 🎫 **兑换码/签名码校验** - 支持一机一码激活机制
- ⬇️ **一键安装应用** - 查询通过后自动跳转安装
- 📊 **步骤指示器** - 清晰展示安装流程进度
- 🌙 **深色主题** - 苹果风格的现代化UI设计
- 📱 **响应式布局** - 完美适配iPhone、iPad等各种屏幕
- ⚡ **GitHub Pages部署** - 推送即自动上线，零运维成本

## 🚀 快速开始

### 1. 部署前端

本项目已配置 GitHub Actions，推送到 `main` 分支后会自动部署到 GitHub Pages。

启用 Pages：
1. 进入仓库 **Settings** → **Pages**
2. Source 选择 **GitHub Actions**
3. 等待首次部署完成（约1-2分钟）

部署后访问地址：`https://<你的用户名>.github.io/ios-sign-portal/`

### 2. 配置后端API

编辑 `js/config.js`，将 `apiBase` 改为你的后端服务地址：

```javascript
const APP_CONFIG = {
    apiBase: 'https://api.yourdomain.com',  // 改成你的后端地址
    // ...
};
```

### 3. 后端接口规范

后端需要实现以下接口（返回格式统一为 `{ code: 0, msg: "", data: {} }`）：

#### ① 获取UDID描述文件
```
GET /udid/profile?token=xxx
```
- 返回 `.mobileconfig` 描述文件
- Content-Type: `application/x-apple-aspen-config`
- 描述文件中回调地址需带上 `token` 参数

#### ② 查询UDID获取结果
```
GET /udid/result?token=xxx
```
返回示例：
```json
{
    "code": 0,
    "msg": "success",
    "data": {
        "udid": "00008110-001A2C345678901E",
        "product": "iPhone13,2",
        "version": "17.0"
    }
}
```

#### ③ 查询安装信息
```
POST /install/query
Content-Type: application/json

{
    "udid": "00008110-001A2C345678901E",
    "code": "ABCD-1234-EFGH-5678"
}
```
返回示例：
```json
{
    "code": 0,
    "msg": "success",
    "data": {
        "ipaUrl": "itms-services://?action=download-manifest&url=https://.../manifest.plist",
        "appName": "你的应用名",
        "appVersion": "1.0.0"
    }
}
```

#### ④ 兑换码激活（可选）
```
POST /code/redeem
Content-Type: application/json

{
    "udid": "00008110-001A2C345678901E",
    "code": "ABCD-1234-EFGH-5678"
}
```

## 📁 项目结构

```
ios-sign-portal/
├── index.html              # 主页面
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── config.js           # API配置（需修改）
│   └── app.js              # 主逻辑
├── .nojekyll               # 禁用Jekyll
├── .github/
│   └── workflows/
│       └── pages.yml       # 自动部署配置
└── README.md
```

## ⚠️ 注意事项

1. **iOS 16+ 需开启开发者模式**：设置 → 隐私与安全性 → 开发者模式
2. **证书一机一码**：每个兑换码绑定一个设备UDID，不可共用
3. **HTTPS要求**：后端服务必须使用HTTPS，否则iOS无法安装描述文件
4. **域名信任**：安装企业证书应用后，需在 设置 → 通用 → VPN与设备管理 中信任证书

## 📄 许可证

仅供学习交流使用，请在遵守当地法律法规的前提下使用。
