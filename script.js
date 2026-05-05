// 全局变量
let medicines = [];
let recycleBin = [];
let currentEditIndex = -1;
const REMINDER_DAYS_KEY = 'reminderDays';
const MEDICINES_KEY = 'medicines';
const RECYCLE_BIN_KEY = 'recycleBin';
const RECYCLE_BIN_EXPIRY_KEY = 'recycleBinExpiry';

// 初始化
function init() {
    // 加载设置
    if (!localStorage.getItem(REMINDER_DAYS_KEY)) {
        localStorage.setItem(REMINDER_DAYS_KEY, '7');
    }
    
    // 加载药品数据
    loadMedicines();
    
    // 加载回收站数据
    loadRecycleBin();
    
    // 检查回收站过期数据
    checkRecycleBinExpiry();
    
    // 渲染页面
    renderHomePage();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 检查过期提醒
    checkExpiryReminders();
}

// 加载药品数据
function loadMedicines() {
    const stored = localStorage.getItem(MEDICINES_KEY);
    if (stored) {
        medicines = JSON.parse(stored);
    }
}

// 保存药品数据
function saveMedicines() {
    localStorage.setItem(MEDICINES_KEY, JSON.stringify(medicines));
}

// 加载回收站数据
function loadRecycleBin() {
    const stored = localStorage.getItem(RECYCLE_BIN_KEY);
    const expiryStored = localStorage.getItem(RECYCLE_BIN_EXPIRY_KEY);
    if (stored && expiryStored) {
        recycleBin = JSON.parse(stored);
        const expiryDate = new Date(expiryStored);
        const now = new Date();
        
        // 检查回收站是否过期
        if (now > expiryDate) {
            clearRecycleBin();
        }
    }
}

// 保存回收站数据
function saveRecycleBin() {
    localStorage.setItem(RECYCLE_BIN_KEY, JSON.stringify(recycleBin));
    // 设置回收站7天后过期
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    localStorage.setItem(RECYCLE_BIN_EXPIRY_KEY, expiryDate.toISOString());
}

// 检查回收站过期
function checkRecycleBinExpiry() {
    const expiryStored = localStorage.getItem(RECYCLE_BIN_EXPIRY_KEY);
    if (expiryStored) {
        const expiryDate = new Date(expiryStored);
        const now = new Date();
        
        if (now > expiryDate) {
            clearRecycleBin();
        }
    }
}

// 清空回收站
function clearRecycleBin() {
    recycleBin = [];
    localStorage.removeItem(RECYCLE_BIN_KEY);
    localStorage.removeItem(RECYCLE_BIN_EXPIRY_KEY);
}

// 渲染首页
function renderHomePage() {
    renderExpiredList();
    updateStats();
}

// 渲染过期提醒列表
function renderExpiredList() {
    const expiredList = document.getElementById('expired-list');
    const alertCount = document.getElementById('alert-count');
    const now = new Date();
    const reminderDays = parseInt(localStorage.getItem(REMINDER_DAYS_KEY));
    
    // 过滤出过期和快过期的药品
    const expiredMedicines = medicines.filter(med => {
        const expiryDate = new Date(med.expiryDate);
        return expiryDate < now;
    });
    
    const nearExpiryMedicines = medicines.filter(med => {
        const expiryDate = new Date(med.expiryDate);
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= reminderDays && diffDays > 0;
    });
    
    const totalAlerts = expiredMedicines.length + nearExpiryMedicines.length;
    alertCount.textContent = totalAlerts;
    
    if (totalAlerts === 0) {
        expiredList.innerHTML = '<p style="font-size: 14px; text-align: center; color: #666;">暂无过期提醒</p>';
        return;
    }
    
    let html = '';
    
    // 添加过期药品
    expiredMedicines.forEach((med, index) => {
        // 找到原始索引
        const originalIndex = medicines.findIndex(m => m.name === med.name && m.expiryDate === med.expiryDate);
        html += `
            <div class="expired-item expired">
                <h3>${med.name}</h3>
                <p>有效期：${formatDate(med.expiryDate)}</p>
                <p>位置：${med.location}</p>
                <button onclick="deleteMedicineFromAlert(${originalIndex})" class="danger-btn small" style="margin-top: 12px;">删除</button>
            </div>
        `;
    });
    
    // 添加快过期药品
    nearExpiryMedicines.forEach(med => {
        html += `
            <div class="expired-item near-expiry">
                <h3>${med.name}</h3>
                <p>有效期：${formatDate(med.expiryDate)}</p>
                <p>位置：${med.location}</p>
            </div>
        `;
    });
    
    expiredList.innerHTML = html;
}

// 更新统计信息
function updateStats() {
    try {
        const totalMedicines = document.getElementById('total-medicines');
        const expiringMedicines = document.getElementById('expiring-medicines');
        const expiredMedicines = document.getElementById('expired-medicines');
        const now = new Date();
        const reminderDays = parseInt(localStorage.getItem(REMINDER_DAYS_KEY));
        
        // 确保 medicines 数组存在
        if (!medicines) {
            console.log('medicines 数组不存在');
            return;
        }
        
        // 计算统计数据
        const total = medicines.length;
        const expiring = medicines.filter(med => {
            const expiryDate = new Date(med.expiryDate);
            const diffTime = expiryDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= reminderDays && diffDays > 0;
        }).length;
        
        const expired = medicines.filter(med => {
            const expiryDate = new Date(med.expiryDate);
            return expiryDate < now;
        }).length;
        
        // 更新UI（仅当元素存在时）
        if (totalMedicines) totalMedicines.textContent = total;
        if (expiringMedicines) expiringMedicines.textContent = expiring;
        if (expiredMedicines) expiredMedicines.textContent = expired;
    } catch (error) {
        // 忽略错误，不影响其他功能
        console.log('统计信息更新失败:', error);
    }
}

// 渲染药品列表
function renderMedicineList() {
    const medicineItems = document.getElementById('medicine-items');
    const now = new Date();
    
    if (medicines.length === 0) {
        medicineItems.innerHTML = '<p style="font-size: 14px; text-align: center; color: #666; margin-top: 40px;">暂无药品，请点击右上方按钮添加</p>';
        return;
    }
    
    let html = '';
    medicines.forEach((med, index) => {
        const expiryDate = new Date(med.expiryDate);
        const isExpired = expiryDate < now;
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isNearExpiry = diffDays <= parseInt(localStorage.getItem(REMINDER_DAYS_KEY)) && diffDays > 0;
        
        let itemClass = 'medicine-item';
        if (isExpired) {
            itemClass += ' expired';
        } else if (isNearExpiry) {
            itemClass += ' near-expiry';
        }
        
        html += `
            <div class="${itemClass}">
                <div style="flex: 1;" onclick="editMedicine(${index})"><!-- 点击药品信息进入编辑 -->
                    <h3>${med.name}</h3>
                    <p>有效期：${formatDate(med.expiryDate)}</p>
                    <p>位置：${med.location}</p>
                    <p>数量：${med.quantity}</p>
                </div>
                <button onclick="event.stopPropagation(); deleteMedicineDirectly(${index})" class="danger-btn small">删除</button>
            </div>
        `;
    });
    
    medicineItems.innerHTML = html;
}

// 渲染回收站
function renderRecycleBin() {
    const recycleBinElement = document.getElementById('recycle-bin');
    
    if (recycleBin.length === 0) {
        recycleBinElement.innerHTML = '<p style="font-size: 14px; text-align: center; color: #666;">回收站为空</p>';
        return;
    }
    
    let html = '';
    recycleBin.forEach((med, index) => {
        html += `
            <div class="recycle-item">
                <h3>${med.name}</h3>
                <p>有效期：${formatDate(med.expiryDate)}</p>
                <p>位置：${med.location}</p>
                <p>数量：${med.quantity}</p>
                <button onclick="restoreMedicine(${index})" class="secondary-btn" style="margin-top: 12px; width: 100%;">恢复</button>
            </div>
        `;
    });
    
    recycleBinElement.innerHTML = html;
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 设置事件监听器
function setupEventListeners() {
    // 页面切换
    document.getElementById('medicines-btn').addEventListener('click', () => {
        showPage('medicines-page');
        renderMedicineList();
    });
    
    document.getElementById('back-from-medicines-btn').addEventListener('click', () => {
        showPage('home-page');
    });
    
    document.getElementById('add-btn').addEventListener('click', () => {
        showPage('add-page');
    });
    
    document.getElementById('quick-add-btn').addEventListener('click', () => {
        showPage('add-page');
    });
    
    document.getElementById('back-btn').addEventListener('click', () => {
        showPage('medicines-page');
        resetAddForm();
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        showPage('settings-page');
        renderRecycleBin();
    });
    
    document.getElementById('back-from-settings-btn').addEventListener('click', () => {
        showPage('home-page');
    });
    
    document.getElementById('back-from-edit-btn').addEventListener('click', () => {
        showPage('medicines-page');
    });
    
    // 保存药品
    document.getElementById('save-btn').addEventListener('click', saveMedicine);
    
    // 更新药品
    document.getElementById('update-btn').addEventListener('click', updateMedicine);
    
    // 删除药品
    document.getElementById('delete-btn').addEventListener('click', deleteMedicine);
    
    // 保存设置
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    
    // 清空回收站
    document.getElementById('clear-recycle-btn').addEventListener('click', () => {
        if (confirm('确定要清空回收站吗？')) {
            clearRecycleBin();
            renderRecycleBin();
        }
    });
    
    // 生成分享链接
    document.getElementById('share-btn').addEventListener('click', generateShareLink);
    
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

// 处理搜索
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const medicineItems = document.getElementById('medicine-items');
    
    if (!searchTerm) {
        renderMedicineList();
        return;
    }
    
    const filteredMedicines = medicines.filter(med => 
        med.name.toLowerCase().includes(searchTerm) ||
        med.location.toLowerCase().includes(searchTerm)
    );
    
    if (filteredMedicines.length === 0) {
        medicineItems.innerHTML = '<p style="font-size: 14px; text-align: center; color: #666; margin-top: 40px;">未找到匹配的药品</p>';
        return;
    }
    
    let html = '';
    const now = new Date();
    
    filteredMedicines.forEach((med, index) => {
        const expiryDate = new Date(med.expiryDate);
        const isExpired = expiryDate < now;
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isNearExpiry = diffDays <= parseInt(localStorage.getItem(REMINDER_DAYS_KEY)) && diffDays > 0;
        
        let itemClass = 'medicine-item';
        if (isExpired) {
            itemClass += ' expired';
        } else if (isNearExpiry) {
            itemClass += ' near-expiry';
        }
        
        // 找到原始索引
        const originalIndex = medicines.findIndex(m => m.name === med.name && m.expiryDate === med.expiryDate);
        
        html += `
            <div class="${itemClass}" onclick="editMedicine(${originalIndex})">
                <h3>${med.name}</h3>
                <p>有效期：${formatDate(med.expiryDate)}</p>
                <p>位置：${med.location}</p>
                <p>数量：${med.quantity}</p>
            </div>
        `;
    });
    
    medicineItems.innerHTML = html;
}

// 显示指定页面
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // 显示目标页面
    document.getElementById(pageId).classList.remove('hidden');
}

// 重置添加表单
function resetAddForm() {
    document.getElementById('medicine-name').value = '';
    document.getElementById('expiry-date').value = '';
    document.getElementById('storage-location').value = '';
    document.getElementById('quantity').value = '1';
}

// 保存药品
function saveMedicine() {
    const name = document.getElementById('medicine-name').value.trim();
    const expiryDate = document.getElementById('expiry-date').value;
    const location = document.getElementById('storage-location').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    
    if (!name) {
        alert('请输入药品名称');
        return;
    }
    
    if (!expiryDate) {
        alert('请选择有效期');
        return;
    }
    
    const newMedicine = {
        name,
        expiryDate,
        location,
        quantity
    };
    
    medicines.push(newMedicine);
    saveMedicines();
    renderHomePage();
    showPage('medicines-page');
    renderMedicineList();
    resetAddForm();
    
    // 检查提醒
    checkExpiryReminders();
}

// 编辑药品
function editMedicine(index) {
    currentEditIndex = index;
    const med = medicines[index];
    
    document.getElementById('edit-medicine-name').value = med.name;
    document.getElementById('edit-expiry-date').value = med.expiryDate;
    document.getElementById('edit-storage-location').value = med.location;
    document.getElementById('edit-quantity').value = med.quantity;
    
    showPage('edit-page');
}

// 更新药品
function updateMedicine() {
    const name = document.getElementById('edit-medicine-name').value.trim();
    const expiryDate = document.getElementById('edit-expiry-date').value;
    const location = document.getElementById('edit-storage-location').value.trim();
    const quantity = parseInt(document.getElementById('edit-quantity').value);
    
    if (!name) {
        alert('请输入药品名称');
        return;
    }
    
    if (!expiryDate) {
        alert('请选择有效期');
        return;
    }
    
    medicines[currentEditIndex] = {
        name,
        expiryDate,
        location,
        quantity
    };
    
    saveMedicines();
    renderHomePage();
    showPage('medicines-page');
    renderMedicineList();
    
    // 检查提醒
    checkExpiryReminders();
}

// 删除药品
function deleteMedicine() {
    if (confirm('确定要删除这个药品吗？删除后可以在回收站找回（保留7天）')) {
        const deletedMedicine = medicines[currentEditIndex];
        recycleBin.push(deletedMedicine);
        medicines.splice(currentEditIndex, 1);
        
        saveMedicines();
        saveRecycleBin();
        renderHomePage();
        showPage('medicines-page');
        renderMedicineList();
    }
}

// 恢复药品
function restoreMedicine(index) {
    const restoredMedicine = recycleBin[index];
    medicines.push(restoredMedicine);
    recycleBin.splice(index, 1);
    
    saveMedicines();
    saveRecycleBin();
    renderHomePage();
    renderRecycleBin();
}

// 从过期提醒中删除药品
function deleteMedicineFromAlert(index) {
    if (confirm('确定要删除这个过期药品吗？删除后可以在回收站找回（保留7天）')) {
        const deletedMedicine = medicines[index];
        recycleBin.push(deletedMedicine);
        medicines.splice(index, 1);
        
        saveMedicines();
        saveRecycleBin();
        renderHomePage();
    }
}

// 直接从药品列表中删除药品
function deleteMedicineDirectly(index) {
    if (confirm('确定要删除这个药品吗？删除后可以在回收站找回（保留7天）')) {
        const deletedMedicine = medicines[index];
        recycleBin.push(deletedMedicine);
        medicines.splice(index, 1);
        
        saveMedicines();
        saveRecycleBin();
        renderHomePage();
        renderMedicineList();
    }
}

// 保存设置
function saveSettings() {
    const reminderDays = document.getElementById('reminder-days').value;
    localStorage.setItem(REMINDER_DAYS_KEY, reminderDays);
    alert('设置保存成功');
    
    // 重新检查提醒
    checkExpiryReminders();
    renderHomePage();
}

// 检查过期提醒
function checkExpiryReminders() {
    const now = new Date();
    const reminderDays = parseInt(localStorage.getItem(REMINDER_DAYS_KEY));
    let hasReminders = false;
    let reminderMessage = '';
    
    medicines.forEach(med => {
        const expiryDate = new Date(med.expiryDate);
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= reminderDays && diffDays >= 0) {
            hasReminders = true;
            reminderMessage += `${med.name} 将在 ${diffDays} 天后过期\n`;
        } else if (diffDays < 0) {
            hasReminders = true;
            reminderMessage += `${med.name} 已经过期 ${Math.abs(diffDays)} 天\n`;
        }
    });
    
    if (hasReminders) {
        // 显示提醒
        alert(reminderMessage);
        // 播放提示音（如果浏览器支持）
        playNotificationSound();
    }
}

// 播放活泼的提示音
function playNotificationSound() {
    try {
        // 创建音频上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建多个振荡器来产生活泼的声音
        const notes = [880, 1100, 1320, 1100]; // 活泼的高音
        const durations = [0.1, 0.1, 0.1, 0.2];
        
        let currentTime = audioContext.currentTime;
        
        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 设置波形为正弦波
            oscillator.type = 'sine';
            
            // 设置频率
            oscillator.frequency.setValueAtTime(frequency, currentTime);
            
            // 设置音量
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + durations[index]);
            
            // 播放
            oscillator.start(currentTime);
            oscillator.stop(currentTime + durations[index]);
            
            // 更新时间
            currentTime += durations[index];
        });
    } catch (e) {
        // 忽略错误
    }
}

// 生成分享链接
function generateShareLink() {
    // 创建分享数据
    const shareData = {
        medicines,
        exportDate: new Date().toISOString()
    };
    
    // 转换为JSON并编码
    const jsonData = JSON.stringify(shareData);
    const encodedData = btoa(unescape(encodeURIComponent(jsonData)));
    
    // 创建分享链接
    const shareLink = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    
    // 显示分享链接
    document.getElementById('share-link').textContent = shareLink;
    document.getElementById('share-link').classList.remove('hidden');
    
    // 尝试复制到剪贴板
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareLink).then(() => {
            alert('分享链接已复制到剪贴板');
        }).catch(() => {
            // 复制失败，让用户手动复制
        });
    }
}

// 拍照识别药品名称
function scanMedicineName() {
    scanFromCamera('medicine-name');
}

// 拍照识别有效期
function scanExpiryDate() {
    scanFromCamera('expiry-date');
}

// 使用百度OCR API进行识别（中文识别更准确）
async function baiduOCR(imageBase64) {
    if (!BAIDU_OCR_API_KEY || !BAIDU_OCR_SECRET_KEY) {
        throw new Error('请先配置百度OCR API Key和Secret Key');
    }
    
    // 先获取access_token
    const tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token';
    const tokenParams = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: BAIDU_OCR_API_KEY,
        client_secret: BAIDU_OCR_SECRET_KEY
    });
    
    const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        body: tokenParams
    });
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
        throw new Error('获取token失败: ' + tokenData.error_description);
    }
    
    // 调用百度通用文字识别（高精度版）
    const ocrUrl = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';
    const ocrParams = new URLSearchParams({
        image: imageBase64.split(',')[1], // 移除data:image/png;base64,前缀
        access_token: tokenData.access_token
    });
    
    const ocrResponse = await fetch(ocrUrl, {
        method: 'POST',
        body: ocrParams,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    const ocrData = await ocrResponse.json();
    
    if (ocrData.words_result) {
        return ocrData.words_result.map(item => item.words).join('\n');
    } else {
        throw new Error('OCR识别失败: ' + ocrData.error_msg);
    }
}

// 使用微信OCR进行识别（需在微信内打开）
function wechatOCR(targetField, callback) {
    if (typeof window.wx === 'undefined') {
        throw new Error('微信JS-SDK未加载，请在微信内打开');
    }
    
    // 选择图片
    wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: function(res) {
            const localIds = res.localIds;
            
            // 使用微信OCR识别
            wx.ocr({
                type: 'photo',
                img: localIds[0],
                success: function(result) {
                    const recognizedText = result.words.map(item => item.word).join('\n');
                    callback(null, recognizedText);
                },
                fail: function(err) {
                    callback(err, null);
                }
            });
        },
        fail: function(err) {
            callback(err, null);
        }
    });
}

// 判断是否在微信内
function isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent);
}

// 初始化微信JS-SDK
async function initWeChatSDK() {
    if (!WECHAT_APPID || !isWeChat()) return;
    
    try {
        // 获取签名（需要后端配合）
        const response = await fetch('/api/wechat/signature?url=' + encodeURIComponent(window.location.href));
        const data = await response.json();
        
        wx.config({
            debug: false,
            appId: WECHAT_APPID,
            timestamp: data.timestamp,
            nonceStr: data.nonceStr,
            signature: data.signature,
            jsApiList: ['chooseImage', 'ocr']
        });
        
        return new Promise((resolve) => {
            wx.ready(() => resolve(true));
            wx.error(() => resolve(false));
        });
    } catch (err) {
        console.error('微信SDK初始化失败:', err);
        return false;
    }
}

// 从摄像头扫描
function scanFromCamera(targetField) {
    // 检查浏览器是否支持摄像头API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('您的浏览器不支持摄像头功能');
        return;
    }
    
    // 创建扫描界面
    const scannerOverlay = document.createElement('div');
    scannerOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;
    
    // 创建视频元素
    const video = document.createElement('video');
    video.style.width = '100%';
    video.style.maxWidth = '500px';
    video.style.height = 'auto';
    video.autoplay = true;
    video.playsInline = true;
    
    // 创建状态文本
    const statusText = document.createElement('p');
    statusText.textContent = '准备就绪';
    statusText.style.cssText = `
        color: white;
        font-size: 16px;
        margin-top: 15px;
        text-align: center;
    `;
    
    // 创建进度条容器
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
        width: 100%;
        max-width: 400px;
        height: 6px;
        background-color: rgba(255,255,255,0.2);
        border-radius: 3px;
        margin-top: 15px;
        overflow: hidden;
    `;
    
    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        width: 0%;
        height: 100%;
        background-color: #3498db;
        border-radius: 3px;
        transition: width 0.3s ease;
    `;
    progressContainer.appendChild(progressBar);
    
    // 创建拍照按钮
    const captureBtn = document.createElement('button');
    captureBtn.textContent = '拍照识别';
    captureBtn.style.cssText = `
        margin-top: 20px;
        padding: 15px 40px;
        font-size: 18px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 30px;
        cursor: pointer;
        transition: all 0.2s;
    `;
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = `
        margin-top: 10px;
        padding: 10px 30px;
        font-size: 14px;
        background-color: transparent;
        color: white;
        border: 1px solid white;
        border-radius: 20px;
        cursor: pointer;
    `;
    
    // 添加元素到界面
    scannerOverlay.appendChild(video);
    scannerOverlay.appendChild(statusText);
    scannerOverlay.appendChild(progressContainer);
    scannerOverlay.appendChild(captureBtn);
    scannerOverlay.appendChild(closeBtn);
    document.body.appendChild(scannerOverlay);
    
    // 获取摄像头权限 - 优化配置
    const constraints = {
        video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            statusText.textContent = '准备就绪，请拍摄药品包装';
        })
        .catch(err => {
            console.error('摄像头访问错误:', err);
            // 如果环境摄像头失败，尝试默认摄像头
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(stream => {
                    video.srcObject = stream;
                    statusText.textContent = '准备就绪，请拍摄药品包装';
                })
                .catch(err => {
                    alert('无法访问摄像头，请确保已授予摄像头权限\n\n解决方法：\n1. 点击浏览器地址栏旁的摄像头图标\n2. 选择"允许"访问摄像头\n3. 或者在系统设置中开启摄像头权限');
                    document.body.removeChild(scannerOverlay);
                });
        });
    
    // 关闭按钮事件
    closeBtn.addEventListener('click', () => {
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        document.body.removeChild(scannerOverlay);
    });
    
    // 拍照按钮事件
    captureBtn.addEventListener('click', async () => {
        // 停止摄像头
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // 显示识别中状态
        captureBtn.disabled = true;
        captureBtn.textContent = '识别中...';
        statusText.textContent = '正在识别文字，请稍候...';
        
        let recognizedText = '';
        
        // 如果在微信内，使用微信OCR
        if (isWeChat()) {
            try {
                statusText.textContent = '正在使用微信OCR识别...';
                // 使用Promise包装微信OCR回调
                const recognizePromise = new Promise((resolve, reject) => {
                    wechatOCR(targetField, (err, text) => {
                        if (err) reject(err);
                        else resolve(text);
                    });
                });
                
                recognizedText = await recognizePromise;
                processRecognitionResult(targetField, recognizedText);
                return;
            } catch (err) {
                console.error('微信OCR失败:', err);
                // 微信OCR失败，继续尝试其他方式
                statusText.textContent = '微信OCR失败，尝试其他识别方式...';
            }
        }
        
        // 创建canvas捕获画面
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        try {
            // 优先使用百度OCR（中文识别更准确）
            if (BAIDU_OCR_API_KEY && BAIDU_OCR_SECRET_KEY) {
                statusText.textContent = '正在使用百度OCR识别...';
                const imageBase64 = canvas.toDataURL('image/png');
                recognizedText = await baiduOCR(imageBase64);
                statusText.textContent = '百度OCR识别完成';
            } else {
                // 回退到Tesseract.js本地识别
                statusText.textContent = '正在使用本地OCR识别...';
                const result = await Tesseract.recognize(
                    canvas,
                    'eng+chi',
                    {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                const progress = Math.round(m.progress * 100);
                                progressBar.style.width = progress + '%';
                                statusText.textContent = `正在识别文字... ${progress}%`;
                            }
                        }
                    }
                );
                recognizedText = result.data.text.trim();
            }
            
            processRecognitionResult(targetField, recognizedText);
        } catch (err) {
            console.error('OCR识别错误:', err);
            // 如果百度OCR失败，尝试Tesseract.js
            if (BAIDU_OCR_API_KEY && BAIDU_OCR_SECRET_KEY) {
                alert('百度OCR识别失败，将使用本地识别重试');
                try {
                    const result = await Tesseract.recognize(canvas, 'eng+chi');
                    recognizedText = result.data.text.trim();
                    processRecognitionResult(targetField, recognizedText);
                } catch (tesseractErr) {
                    alert('识别失败，请重试: ' + tesseractErr.message);
                    document.body.removeChild(scannerOverlay);
                }
            } else {
                alert('识别失败，请重试: ' + err.message);
                document.body.removeChild(scannerOverlay);
            }
        }
    });
    
    // 处理识别结果
    function processRecognitionResult(targetField, recognizedText) {
        if (targetField === 'medicine-name') {
            // 提取药品名称（取第一行或前30个字符）
            const medicineName = recognizedText.split('\n')[0].substring(0, 30);
            document.getElementById('medicine-name').value = medicineName;
            alert(`识别结果：${medicineName}`);
        } else {
            // 尝试从识别结果中提取日期
            const datePatterns = [
                /(\d{4})[年\-/](\d{1,2})[月\-/](\d{1,2})/,
                /(\d{4})(\d{2})(\d{2})/,
                /(\d{2})[年\-/](\d{1,2})[月\-/](\d{1,2})/
            ];
            
            let foundDate = null;
            for (const pattern of datePatterns) {
                const match = recognizedText.match(pattern);
                if (match) {
                    if (pattern.source.startsWith('(\\d{4})')) {
                        foundDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
                    } else {
                        const year = match[1].length === 2 ? '20' + match[1] : match[1];
                        foundDate = `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
                    }
                    break;
                }
            }
            
            if (foundDate) {
                document.getElementById('expiry-date').value = foundDate;
                alert(`识别结果：${foundDate}`);
            } else {
                alert(`未识别到日期，识别内容：${recognizedText}`);
            }
        }
        
        document.body.removeChild(scannerOverlay);
    }
}

// 处理分享链接
function handleShareLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('data');
    
    if (data) {
        try {
            // 解码数据
            const decodedData = decodeURIComponent(escape(atob(data)));
            const shareData = JSON.parse(decodedData);
            
            // 显示分享的数据
            if (shareData.medicines && shareData.medicines.length > 0) {
                if (confirm('检测到分享的药品数据，是否要导入？')) {
                    medicines = medicines.concat(shareData.medicines);
                    saveMedicines();
                    renderHomePage();
                }
            }
        } catch (e) {
            // 忽略错误
        }
    }
}

// 初始化应用
init();

// 处理分享链接
handleShareLink();

// 定期检查过期提醒（每小时）
setInterval(checkExpiryReminders, 60 * 60 * 1000);