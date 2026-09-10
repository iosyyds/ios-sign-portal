/**
 * ============================================
 *  后端 API 配置文件
 * ============================================
 *  使用说明：
 *  1. 将 apiBase 改为你自己的后端服务地址
 *  2. 确保后端实现了下方列出的接口
 *  3. 接口返回格式统一为 JSON: { code: 0, msg: "", data: {} }
 * 
 *  需要后端实现的接口：
 *  - GET  {apiBase}/udid/profile       返回 .mobileconfig 描述文件（Content-Type: application/x-apple-aspen-config）
 *  - GET  {apiBase}/udid/result?token=xxx  根据token查询获取到的UDID
 *  - POST {apiBase}/install/query      请求体: { udid, code }  返回: { ipaUrl, appName, appVersion }
 *  - POST {apiBase}/code/redeem        请求体: { udid, code }  兑换码激活（可选）
 * ============================================
 */

const APP_CONFIG = {
    // ========== 后端服务地址 ==========
    // 示例: 'https://api.yourdomain.com' 或 'https://your-server.com/api'
    // 本地开发: 'http://localhost:3000'
    apiBase: 'https://api.example.com',

    // ========== 应用信息 ==========
    appName: 'iOS 签名应用',
    appVersion: '1.0.0',

    // ========== UDID 获取配置 ==========
    udid: {
        // 描述文件下载端点（后端需返回 .mobileconfig）
        profileEndpoint: '/udid/profile',
        // 查询UDID结果端点
        resultEndpoint: '/udid/result',
        // 轮询间隔（毫秒）
        pollInterval: 2000,
        // 最大轮询次数（超时）
        maxPollCount: 30,
    },

    // ========== 安装查询配置 ==========
    install: {
        // 查询安装端点
        queryEndpoint: '/install/query',
        // 兑换码激活端点（可选，留空则跳过激活步骤）
        redeemEndpoint: '/code/redeem',
    },

    // ========== 调试模式 ==========
    // 开启后会在控制台输出详细日志，上线前请关闭
    debug: false,
};

// 冻结配置，防止运行时被修改
Object.freeze(APP_CONFIG);
