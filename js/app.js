/**
 * ============================================
 *  iOS 签名安装中心 - 主逻辑
 * ============================================
 */

(function () {
    'use strict';

    // ========== 工具函数 ==========
    const log = (...args) => {
        if (APP_CONFIG.debug) console.log('[SignPortal]', ...args);
    };

    const showLoading = (text) => {
        document.getElementById('loadingText').textContent = text || '正在处理...';
        document.getElementById('loadingOverlay').style.display = 'flex';
    };

    const hideLoading = () => {
        document.getElementById('loadingOverlay').style.display = 'none';
    };

    const showStatus = (type, text) => {
        const area = document.getElementById('statusArea');
        const icon = document.getElementById('statusIcon');
        const textEl = document.getElementById('statusText');
        
        area.className = 'status-area ' + type;
        icon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        textEl.textContent = text;
        area.style.display = 'flex';
    };

    const hideStatus = () => {
        document.getElementById('statusArea').style.display = 'none';
    };

    const setStep = (stepNum, status) => {
        const step = document.getElementById('step' + stepNum);
        if (!step) return;
        step.classList.remove('active', 'completed');
        if (status) step.classList.add(status);
    };

    // ========== 生成随机Token ==========
    const generateToken = () => {
        return 'udid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    };

    // ========== UDID 获取模块 ==========
    const UdidModule = {
        token: null,
        pollTimer: null,
        pollCount: 0,

        init() {
            const btn = document.getElementById('getUdidBtn');
            btn.addEventListener('click', () => this.startGetUdid());
        },

        startGetUdid() {
            hideStatus();
            this.token = generateToken();
            this.pollCount = 0;

            // 构建描述文件下载URL，带上token用于回调识别
            const profileUrl = APP_CONFIG.apiBase + APP_CONFIG.udid.profileEndpoint + '?token=' + this.token;
            
            log('下载描述文件:', profileUrl);

            // 触发描述文件下载
            window.location.href = profileUrl;

            // 开始轮询UDID结果
            showLoading('请在「设置」中安装描述文件，正在等待设备响应...');
            this.startPolling();
        },

        startPolling() {
            if (this.pollTimer) clearInterval(this.pollTimer);
            
            this.pollTimer = setInterval(() => {
                this.pollCount++;
                log('轮询UDID第', this.pollCount, '次');

                if (this.pollCount > APP_CONFIG.udid.maxPollCount) {
                    this.stopPolling();
                    hideLoading();
                    showStatus('error', '获取UDID超时，请检查是否已安装描述文件，或点击按钮重试。');
                    return;
                }

                this.queryUdid();
            }, APP_CONFIG.udid.pollInterval);
        },

        stopPolling() {
            if (this.pollTimer) {
                clearInterval(this.pollTimer);
                this.pollTimer = null;
            }
        },

        async queryUdid() {
            try {
                const url = APP_CONFIG.apiBase + APP_CONFIG.udid.resultEndpoint + '?token=' + this.token;
                const res = await fetch(url, { method: 'GET' });
                const data = await res.json();

                log('UDID查询结果:', data);

                if (data.code === 0 && data.data && data.data.udid) {
                    this.stopPolling();
                    hideLoading();
                    
                    const udid = data.data.udid;
                    document.getElementById('udidInput').value = udid;
                    document.getElementById('udidHint').textContent = '✅ UDID获取成功：' + udid.substring(0, 8) + '...' + udid.substring(-4);
                    document.getElementById('udidHint').style.color = 'var(--success)';
                    
                    setStep(1, 'completed');
                    setStep(2, 'active');
                    showStatus('success', '设备UDID获取成功！请输入兑换码后查询安装。');
                }
            } catch (err) {
                log('UDID查询出错:', err);
                // 轮询期间出错不中断，继续等待
            }
        }
    };

    // ========== 安装查询模块 ==========
    const InstallModule = {
        init() {
            const btn = document.getElementById('installBtn');
            btn.addEventListener('click', () => this.handleInstall());

            // 回车快捷提交
            document.getElementById('codeInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleInstall();
            });
        },

        async handleInstall() {
            const udid = document.getElementById('udidInput').value.trim();
            const code = document.getElementById('codeInput').value.trim();

            // 校验
            if (!udid) {
                showStatus('error', '请先获取设备UDID！');
                document.getElementById('getUdidBtn').classList.add('shake');
                setTimeout(() => document.getElementById('getUdidBtn').classList.remove('shake'), 300);
                return;
            }

            if (udid.length < 20) {
                showStatus('error', 'UDID格式不正确，请重新获取。');
                return;
            }

            hideStatus();
            showLoading('正在验证设备信息并查询应用...');

            try {
                // 1. 如果有兑换码，先激活
                if (code && APP_CONFIG.install.redeemEndpoint) {
                    await this.redeemCode(udid, code);
                }

                // 2. 查询安装信息
                const result = await this.queryInstall(udid, code);

                hideLoading();

                if (result && result.ipaUrl) {
                    setStep(2, 'completed');
                    setStep(3, 'active');
                    
                    const appName = result.appName || APP_CONFIG.appName;
                    const appVersion = result.appVersion || APP_CONFIG.appVersion;
                    
                    showStatus('success', 
                        `查询成功！应用：${appName} v${appVersion}\n正在跳转安装，请在弹窗中点击「安装」。`
                    );

                    // 触发安装
                    setTimeout(() => {
                        window.location.href = result.ipaUrl;
                        setStep(3, 'completed');
                    }, 1500);
                } else {
                    showStatus('error', '未查询到可安装的应用，请检查兑换码是否正确，或联系客服。');
                }
            } catch (err) {
                hideLoading();
                log('安装查询出错:', err);
                showStatus('error', err.message || '查询失败，请稍后重试或联系客服。');
            }
        },

        async redeemCode(udid, code) {
            const url = APP_CONFIG.apiBase + APP_CONFIG.install.redeemEndpoint;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ udid, code })
            });
            const data = await res.json();
            
            log('兑换码激活结果:', data);
            
            if (data.code !== 0) {
                throw new Error(data.msg || '兑换码激活失败');
            }
            return data.data;
        },

        async queryInstall(udid, code) {
            const url = APP_CONFIG.apiBase + APP_CONFIG.install.queryEndpoint;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ udid, code })
            });
            const data = await res.json();
            
            log('安装查询结果:', data);
            
            if (data.code !== 0) {
                throw new Error(data.msg || '查询失败');
            }
            return data.data;
        }
    };

    // ========== 背景粒子效果 ==========
    const ParticleModule = {
        init() {
            const container = document.getElementById('particles');
            const count = 30;
            
            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                p.style.left = Math.random() * 100 + '%';
                p.style.top = Math.random() * 100 + '%';
                p.style.animationDelay = Math.random() * 15 + 's';
                p.style.animationDuration = (10 + Math.random() * 15) + 's';
                p.style.opacity = 0.2 + Math.random() * 0.4;
                container.appendChild(p);
            }
        }
    };

    // ========== 初始化 ==========
    const init = () => {
        log('应用初始化，配置:', APP_CONFIG);
        
        ParticleModule.init();
        UdidModule.init();
        InstallModule.init();

        // 检测是否为iOS设备
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!isIOS) {
            showStatus('info', '⚠️ 检测到您当前使用的不是iOS设备，部分功能可能无法正常使用。建议使用iPhone或iPad访问。');
        }

        // 检查API是否已配置
        if (APP_CONFIG.apiBase === 'https://api.example.com') {
            console.warn('[SignPortal] 警告：apiBase 尚未配置，请修改 js/config.js 中的 apiBase 为你的后端地址。');
        }
    };

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
