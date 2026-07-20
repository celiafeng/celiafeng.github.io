// ========== 全局状态 ==========
let medicines = [];
let recycleBin = [];
let currentEditIndex = -1;
let contacts = [];
let isLoggedIn = false;
let loginUser = null;
let notifiedExpiredMeds = new Set();

const KEYS = {
    MEDICINES: 'medicines',
    RECYCLE_BIN: 'recycleBin',
    RECYCLE_EXPIRY: 'recycleBinExpiry',
    REMINDER_DAYS: 'reminderDays',
    CONTACTS: 'contacts',
    LOGIN_USER: 'loginUser',
    NOTIFIED_MEDS: 'notifiedExpiredMeds'
};

// ========== 角色姿态图片映射 ==========
const SPRITE_POSES = {
    cheering: 'assets/pill-cheering.jpg',
    jumping: 'assets/pill-jumping.jpg',
    sleeping: 'assets/pill-sleeping.jpg',
    thinking: 'assets/pill-thinking.jpg',
    sad: 'assets/pill-sad.jpg',
    thumbsup: 'assets/pill-thumbsup.jpg'
};

// 页面导航历史（用于动画方向判断）
let pageHistory = [];
let currentPage = 'login-page';

// ========== 初始化 ==========
function init() {
    initVoice();
    initSprite();
    loadAllData();
    checkLogin();
}

function initVoice() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
}

function loadAllData() {
    if (!localStorage.getItem(KEYS.REMINDER_DAYS)) localStorage.setItem(KEYS.REMINDER_DAYS, '7');
    loadMedicines();
    loadRecycleBin();
    loadContacts();
    loadLoginState();
    loadNotifiedMeds();
}

function loadLoginState() {
    const stored = localStorage.getItem(KEYS.LOGIN_USER);
    if (stored) { loginUser = JSON.parse(stored); isLoggedIn = true; }
}

function loadNotifiedMeds() {
    const stored = localStorage.getItem(KEYS.NOTIFIED_MEDS);
    if (stored) notifiedExpiredMeds = new Set(JSON.parse(stored));
}

function saveNotifiedMeds() {
    localStorage.setItem(KEYS.NOTIFIED_MEDS, JSON.stringify([...notifiedExpiredMeds]));
}

// ========== 登录系统 ==========
function checkLogin() {
    if (isLoggedIn) {
        showPage('home-page');
        renderHomePage();
        setupEventListeners();
        checkExpiryReminders();
        showSprite();
        setTimeout(() => showWelcome(), 600);
    } else {
        showPage('login-page');
        hideSprite();
        setupLoginEvents();
    }
}

function setupLoginEvents() {
    document.getElementById('login-phone').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function switchLoginTab(type) {
    const phoneTab = document.querySelector('.login-tab:nth-child(1)');
    const wechatTab = document.querySelector('.login-tab:nth-child(2)');
    const phoneForm = document.getElementById('phone-login');
    const wechatForm = document.getElementById('wechat-login');
    
    if (type === 'phone') {
        phoneTab.classList.add('active');
        wechatTab.classList.remove('active');
        phoneForm.classList.remove('hidden');
        wechatForm.classList.add('hidden');
    } else {
        wechatTab.classList.add('active');
        phoneTab.classList.remove('active');
        wechatForm.classList.remove('hidden');
        phoneForm.classList.add('hidden');
    }
}

function wechatLogin() {
    if (!window.WECHAT_APPID || !window.WECHAT_APPID.trim()) {
        loginUser = { type: 'wechat', openid: 'demo_openid' };
        isLoggedIn = true;
        localStorage.setItem(KEYS.LOGIN_USER, JSON.stringify(loginUser));
        showContactsGuide();
        return;
    }
    
    const redirectUri = encodeURIComponent(window.location.href);
    const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${window.WECHAT_APPID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`;
    window.location.href = url;
}

function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    if (!/^1\d{10}$/.test(phone)) { alert('请输入正确的手机号'); return; }
    loginUser = { type: 'phone', phone };
    isLoggedIn = true;
    localStorage.setItem(KEYS.LOGIN_USER, JSON.stringify(loginUser));
    showContactsGuide();
}

// ========== 亲密联系人 ==========
function loadContacts() {
    const stored = localStorage.getItem(KEYS.CONTACTS);
    if (stored) contacts = JSON.parse(stored);
}

function saveContacts() {
    localStorage.setItem(KEYS.CONTACTS, JSON.stringify(contacts));
}

function showAddContact() {
    document.getElementById('add-contact-form').classList.remove('hidden');
}

function cancelAddContact() {
    document.getElementById('add-contact-form').classList.add('hidden');
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
}

function addContact() {
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    if (!name) { alert('请输入联系人姓名'); return; }
    if (!/^1\d{10}$/.test(phone)) { alert('请输入正确的手机号'); return; }
    contacts.push({ name, phone });
    saveContacts();
    renderContactChips();
    cancelAddContact();
}

function removeContact(index) {
    contacts.splice(index, 1);
    saveContacts();
    renderContactChips();
}

function renderContactChips() {
    const container = document.getElementById('contact-list');
    if (contacts.length === 0) {
        container.innerHTML = '<p style="font-size:13px;color:#A1887F;">暂无亲密联系人</p>';
        return;
    }
    container.innerHTML = contacts.map((c, i) =>
        `<span class="contact-chip">${c.name} (${c.phone}) <span class="remove" onclick="removeContact(${i})">×</span></span>`
    ).join('');
}

function renderContacts() {
    const container = document.getElementById('contacts-page-list');
    if (contacts.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#A1887F;padding:40px;">暂无亲密联系人</p>';
        return;
    }
    container.innerHTML = contacts.map((c, i) => `
        <div class="contact-card">
            <div class="avatar">${c.name[0]}</div>
            <div class="info">
                <div class="name">${c.name}</div>
                <div class="phone">${c.phone}</div>
            </div>
            <button class="danger-btn small" onclick="removeContact(${i})">删除</button>
        </div>
    `).join('');
}

function showAddContact2() {
    document.getElementById('add-contact-form2').classList.remove('hidden');
    document.getElementById('add-contact-btn2').classList.add('hidden');
}

function cancelAddContact2() {
    document.getElementById('add-contact-form2').classList.add('hidden');
    document.getElementById('add-contact-btn2').classList.remove('hidden');
    document.getElementById('contact-name2').value = '';
    document.getElementById('contact-phone2').value = '';
}

function addContact2() {
    const name = document.getElementById('contact-name2').value.trim();
    const phone = document.getElementById('contact-phone2').value.trim();
    if (!name) { alert('请输入联系人姓名'); return; }
    if (!/^1\d{10}$/.test(phone)) { alert('请输入正确的手机号'); return; }
    contacts.push({ name, phone });
    saveContacts();
    renderContacts();
    cancelAddContact2();
}

// ========== 联系人引导页 ==========
function showContactsGuide() {
    showPage('contacts-guide-page');
}

function saveGuideContact() {
    const name = document.getElementById('guide-contact-name').value.trim();
    const phone = document.getElementById('guide-contact-phone').value.trim();
    
    if (!name && !phone) {
        enterHome();
        return;
    }
    
    if (!name) { alert('请输入联系人姓名'); return; }
    if (!/^1\d{10}$/.test(phone)) { alert('请输入正确的手机号'); return; }
    
    contacts.push({ name, phone });
    saveContacts();
    enterHome();
}

function skipContactsGuide() {
    enterHome();
}

function enterHome() {
    showPage('home-page');
    renderHomePage();
    setupEventListeners();
    checkExpiryReminders();
    showSprite();
    setTimeout(() => showWelcome(), 500);
}

// ========== 页面切换（带动画方向） ==========
function showPage(pageId) {
    const isForward = isPageForward(currentPage, pageId);
    pageHistory.push(currentPage);
    currentPage = pageId;

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active', 'slide-left', 'slide-right');
    });

    const target = document.getElementById(pageId);
    target.classList.add('active');
    if (isForward) {
        target.classList.add('slide-left');
    } else {
        target.classList.add('slide-right');
    }

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function isPageForward(from, to) {
    const pageOrder = ['login-page', 'contacts-guide-page', 'home-page', 'medicines-page', 'add-page', 'edit-page', 'settings-page', 'contacts-page'];
    const fromIdx = pageOrder.indexOf(from);
    const toIdx = pageOrder.indexOf(to);
    if (fromIdx === -1 || toIdx === -1) return true;
    return toIdx > fromIdx;
}

// ========== 事件监听器 ==========
function setupEventListeners() {
    const bind = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    bind('medicines-btn', 'click', () => { showPage('medicines-page'); renderMedicineList(); });
    bind('back-from-medicines-btn', 'click', () => showPage('home-page'));
    bind('add-btn', 'click', () => showPage('add-page'));
    bind('quick-add-btn', 'click', () => showPage('add-page'));
    bind('back-btn', 'click', () => { showPage('medicines-page'); renderMedicineList(); resetAddForm(); });
    bind('settings-btn', 'click', () => { showPage('settings-page'); renderRecycleBin(); renderSettings(); });
    bind('back-from-settings-btn', 'click', () => showPage('home-page'));
    bind('back-from-edit-btn', 'click', () => { showPage('medicines-page'); renderMedicineList(); });
    bind('save-btn', 'click', saveMedicine);
    bind('update-btn', 'click', updateMedicine);
    bind('delete-btn', 'click', deleteMedicine);
    bind('save-settings-btn', 'click', saveSettings);
    bind('clear-recycle-btn', 'click', () => {
        if (confirm('确定要清空回收站吗？')) { clearRecycleBin(); renderRecycleBin(); }
    });
    bind('share-btn', 'click', generateShareLink);
    bind('back-from-contacts-btn', 'click', () => showPage('home-page'));
    bind('logout-btn', 'click', handleLogout);

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', handleSearch);
}

function handleLogout() {
    if (!confirm('确定要退出登录吗？')) return;
    isLoggedIn = false;
    loginUser = null;
    localStorage.removeItem(KEYS.LOGIN_USER);
    hideSprite();
    showPage('login-page');
    document.getElementById('login-phone').value = '';
}

// ========== 药品数据操作 ==========
function loadMedicines() {
    const stored = localStorage.getItem(KEYS.MEDICINES);
    if (stored) medicines = JSON.parse(stored);
}

function saveMedicines() {
    localStorage.setItem(KEYS.MEDICINES, JSON.stringify(medicines));
}

function loadRecycleBin() {
    const stored = localStorage.getItem(KEYS.RECYCLE_BIN);
    const expiryStored = localStorage.getItem(KEYS.RECYCLE_EXPIRY);
    if (stored && expiryStored) {
        recycleBin = JSON.parse(stored);
        if (new Date() > new Date(expiryStored)) clearRecycleBin();
    }
}

function saveRecycleBin() {
    localStorage.setItem(KEYS.RECYCLE_BIN, JSON.stringify(recycleBin));
    const expiry = new Date(); expiry.setDate(expiry.getDate() + 7);
    localStorage.setItem(KEYS.RECYCLE_EXPIRY, expiry.toISOString());
}

function clearRecycleBin() {
    recycleBin = [];
    localStorage.removeItem(KEYS.RECYCLE_BIN);
    localStorage.removeItem(KEYS.RECYCLE_EXPIRY);
}

// ========== 渲染首页 ==========
function renderHomePage() { renderExpiredList(); }

function renderExpiredList() {
    const container = document.getElementById('expired-list');
    const badge = document.getElementById('alert-count');
    const now = new Date();
    const reminderDays = parseInt(localStorage.getItem(KEYS.REMINDER_DAYS)) || 7;

    const expiredMeds = medicines.filter(m => new Date(m.expiryDate) < now);
    const nearExpiryMeds = medicines.filter(m => {
        const d = new Date(m.expiryDate);
        const diff = Math.ceil((d - now) / 86400000);
        return diff <= reminderDays && diff > 0;
    });

    const total = expiredMeds.length + nearExpiryMeds.length;
    badge.textContent = total;

    if (total === 0) {
        container.innerHTML = '<p style="font-size:14px;text-align:center;color:#A1887F;">暂无过期提醒，一切安好~</p>';
        return;
    }

    let html = '';
    expiredMeds.forEach(med => {
        const idx = medicines.findIndex(m => m.name === med.name && m.expiryDate === med.expiryDate);
        html += `<div class="expired-item expired"><div class="info"><div class="name">${med.name}</div><div class="detail">有效期：${formatDate(med.expiryDate)}</div><div class="detail">位置：${med.location}</div></div><button onclick="event.stopPropagation();deleteMedicineFromAlert(${idx})" class="danger-btn small">删除</button></div>`;
    });
    nearExpiryMeds.forEach(med => {
        html += `<div class="expired-item near-expiry"><div class="info"><div class="name">${med.name}</div><div class="detail">有效期：${formatDate(med.expiryDate)}</div><div class="detail">位置：${med.location}</div></div></div>`;
    });
    container.innerHTML = html;
}

function renderMedicineList() {
    const container = document.getElementById('medicine-items');
    if (medicines.length === 0) {
        container.innerHTML = '<p style="font-size:14px;text-align:center;color:#A1887F;margin-top:40px;">暂无药品，请点击右上方按钮添加</p>';
        return;
    }
    const now = new Date();
    const reminderDays = parseInt(localStorage.getItem(KEYS.REMINDER_DAYS)) || 7;
    container.innerHTML = medicines.map((med, i) => {
        const d = new Date(med.expiryDate);
        const isExpired = d < now;
        const diff = Math.ceil((d - now) / 86400000);
        const isNear = diff <= reminderDays && diff > 0;
        let cls = 'medicine-item';
        if (isExpired) cls += ' expired';
        else if (isNear) cls += ' near-expiry';
        else cls += ' normal';
        return `<div class="${cls}"><div style="flex:1;" onclick="editMedicine(${i})"><div class="name">${med.name}</div><div class="detail">有效期：${formatDate(med.expiryDate)}</div><div class="detail">位置：${med.location}</div><div class="detail">数量：${med.quantity}</div></div><button onclick="event.stopPropagation();deleteMedicineDirectly(${i})" class="danger-btn small">删除</button></div>`;
    }).join('');
}

function renderRecycleBin() {
    const container = document.getElementById('recycle-bin');
    if (recycleBin.length === 0) {
        container.innerHTML = '<p style="font-size:14px;text-align:center;color:#A1887F;">回收站为空</p>';
        return;
    }
    container.innerHTML = recycleBin.map((med, i) => `
        <div class="recycle-item"><div class="info"><div class="name">${med.name}</div><div class="detail">有效期：${formatDate(med.expiryDate)}</div><div class="detail">位置：${med.location}</div><div class="detail">数量：${med.quantity}</div></div><button onclick="restoreMedicine(${i})" class="secondary-btn">恢复</button></div>
    `).join('');
}

function renderSettings() {
    const days = localStorage.getItem(KEYS.REMINDER_DAYS) || '7';
    document.getElementById('reminder-days').value = days;
}

function formatDate(dateString) {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ========== 药品操作 ==========
function saveMedicine() {
    const name = document.getElementById('medicine-name').value.trim();
    const expiryDate = document.getElementById('expiry-date').value;
    const location = document.getElementById('storage-location').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    if (!name) { alert('请输入药品名称'); return; }
    if (!expiryDate) { alert('请选择有效期'); return; }
    medicines.push({ name, expiryDate, location, quantity });
    saveMedicines();
    renderHomePage();
    showPage('medicines-page');
    renderMedicineList();
    resetAddForm();
    checkExpiryReminders();

    // 保存后切换精灵姿态
    setSpritePose('thumbsup');
    spriteBubble('药品已添加！');
}

function resetAddForm() {
    document.getElementById('medicine-name').value = '';
    document.getElementById('expiry-date').value = '';
    document.getElementById('storage-location').value = '';
    document.getElementById('quantity').value = '1';
}

function editMedicine(index) {
    currentEditIndex = index;
    const med = medicines[index];
    document.getElementById('edit-medicine-name').value = med.name;
    document.getElementById('edit-expiry-date').value = med.expiryDate;
    document.getElementById('edit-storage-location').value = med.location;
    document.getElementById('edit-quantity').value = med.quantity;
    showPage('edit-page');
}

function updateMedicine() {
    const name = document.getElementById('edit-medicine-name').value.trim();
    const expiryDate = document.getElementById('edit-expiry-date').value;
    const location = document.getElementById('edit-storage-location').value.trim();
    const quantity = parseInt(document.getElementById('edit-quantity').value) || 1;
    if (!name) { alert('请输入药品名称'); return; }
    if (!expiryDate) { alert('请选择有效期'); return; }
    medicines[currentEditIndex] = { name, expiryDate, location, quantity };
    saveMedicines();
    renderHomePage();
    showPage('medicines-page');
    renderMedicineList();
    checkExpiryReminders();
    setSpritePose('cheering');
    spriteBubble('更新成功！');
}

function deleteMedicine() {
    if (confirm('确定要删除这个药品吗？删除后可以在回收站找回（保留7天）')) {
        recycleBin.push(medicines[currentEditIndex]);
        medicines.splice(currentEditIndex, 1);
        saveMedicines(); saveRecycleBin();
        renderHomePage();
        showPage('medicines-page'); renderMedicineList();
        setSpritePose('sad');
        spriteBubble('已移到回收站~');
    }
}

function deleteMedicineFromAlert(index) {
    if (confirm('确定要删除这个过期药品吗？')) {
        recycleBin.push(medicines[index]);
        medicines.splice(index, 1);
        saveMedicines(); saveRecycleBin();
        renderHomePage();
    }
}

function deleteMedicineDirectly(index) {
    if (confirm('确定要删除这个药品吗？')) {
        recycleBin.push(medicines[index]);
        medicines.splice(index, 1);
        saveMedicines(); saveRecycleBin();
        renderHomePage(); renderMedicineList();
    }
}

function restoreMedicine(index) {
    medicines.push(recycleBin[index]);
    recycleBin.splice(index, 1);
    saveMedicines(); saveRecycleBin();
    renderHomePage(); renderRecycleBin();
    setSpritePose('cheering');
    spriteBubble('已恢复！');
}

function handleSearch() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const container = document.getElementById('medicine-items');
    if (!term) { renderMedicineList(); return; }
    const filtered = medicines.filter(m => m.name.toLowerCase().includes(term) || m.location.toLowerCase().includes(term));
    if (filtered.length === 0) {
        container.innerHTML = '<p style="font-size:14px;text-align:center;color:#A1887F;margin-top:40px;">未找到匹配的药品</p>';
        return;
    }
    const now = new Date();
    const rd = parseInt(localStorage.getItem(KEYS.REMINDER_DAYS)) || 7;
    container.innerHTML = filtered.map(med => {
        const d = new Date(med.expiryDate);
        const isExp = d < now;
        const diff = Math.ceil((d - now) / 86400000);
        let cls = 'medicine-item';
        if (isExp) cls += ' expired';
        else if (diff <= rd && diff > 0) cls += ' near-expiry';
        else cls += ' normal';
        const idx = medicines.findIndex(m => m.name === med.name && m.expiryDate === med.expiryDate);
        return `<div class="${cls}" onclick="editMedicine(${idx})"><div class="name">${med.name}</div><div class="detail">有效期：${formatDate(med.expiryDate)}</div><div class="detail">位置：${med.location}</div><div class="detail">数量：${med.quantity}</div></div>`;
    }).join('');
}

// ========== 设置 ==========
function saveSettings() {
    const days = document.getElementById('reminder-days').value;
    localStorage.setItem(KEYS.REMINDER_DAYS, days);
    alert('设置保存成功');
    checkExpiryReminders();
    renderHomePage();
}

function generateShareLink() {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({ medicines, exportDate: new Date().toISOString() }))));
    const link = `${window.location.origin}${window.location.pathname}?data=${data}`;
    document.getElementById('share-link').textContent = link;
    document.getElementById('share-link').classList.remove('hidden');
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => alert('分享链接已复制到剪贴板')).catch(() => {});
    }
}

// ========== 过期提醒 ==========
function checkExpiryReminders() {
    if (!isLoggedIn) return;
    const now = new Date();
    const reminderDays = parseInt(localStorage.getItem(KEYS.REMINDER_DAYS)) || 7;

    const threeDayMeds = medicines.filter(med => {
        const diff = Math.ceil((new Date(med.expiryDate) - now) / 86400000);
        return diff <= 3 && diff > 0;
    });

    if (threeDayMeds.length > 0) {
        const names = threeDayMeds.map(m => m.name).join('、');
        const diff = Math.ceil((new Date(threeDayMeds[0].expiryDate) - now) / 86400000);
        showExpiryModal(names, diff);
        playNotificationSound();
        setSpritePose('thinking');
        spriteBubble(`${names} 还有${diff}天过期！`);
    }

    const expiredNotDeleted = medicines.filter(med => {
        const key = med.name + med.expiryDate;
        return new Date(med.expiryDate) < now && !notifiedExpiredMeds.has(key);
    });

    if (expiredNotDeleted.length > 0 && contacts.length > 0) {
        const names = expiredNotDeleted.map(m => m.name).join('、');
        showNotifyModal(names);
        expiredNotDeleted.forEach(med => notifiedExpiredMeds.add(med.name + med.expiryDate));
        saveNotifiedMeds();
    }
}

function showExpiryModal(names, days) {
    document.getElementById('expiry-msg').textContent = `【${names}】还有 ${days} 天就要过期了，请及时处理！`;
    document.getElementById('expiry-modal').classList.remove('hidden');
}

function closeExpiryModal() {
    document.getElementById('expiry-modal').classList.add('hidden');
}

function showNotifyModal(names) {
    const contactNames = contacts.map(c => c.name).join('、');
    document.getElementById('notify-msg').textContent = `【${names}】已经过期尚未删除！小精灵建议通知 ${contactNames} 提醒您清理药品。`;
    document.getElementById('notify-modal').classList.remove('hidden');
    document.getElementById('notify-send-btn').onclick = () => sendNotificationToContacts(names);
}

function closeNotifyModal() {
    document.getElementById('notify-modal').classList.add('hidden');
}

function sendNotificationToContacts(names) {
    if (contacts.length === 0) {
        alert('暂无亲密联系人');
        return;
    }
    const contactNames = contacts.map(c => c.name).join('、');
    alert(`已模拟通知 ${contactNames}：\n\n您好，您家人的药品【${names}】已经过期，请提醒及时清理！\n\n（实际应用中会通过短信或微信发送）`);
    closeNotifyModal();
    setSpritePose('thumbsup');
    spriteBubble('已通知联系人！');
}

// ========== 小精灵系统 ==========
function initSprite() {
    const sprite = document.getElementById('sprite');
    sprite.style.right = '20px';
    sprite.style.bottom = '100px';

    let dragging = false, startX, startY, origX, origY, hasMoved = false;

    sprite.addEventListener('mousedown', e => {
        dragging = true;
        hasMoved = false;
        startX = e.clientX; startY = e.clientY;
        const rect = sprite.getBoundingClientRect();
        origX = rect.left; origY = rect.top;
        sprite.style.animation = 'none';
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
        sprite.style.left = (origX + dx) + 'px';
        sprite.style.top = (origY + dy) + 'px';
        sprite.style.right = 'auto'; sprite.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
        if (dragging) {
            dragging = false;
            sprite.style.animation = '';
        }
    });

    sprite.addEventListener('touchstart', e => {
        dragging = true;
        hasMoved = false;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        const rect = sprite.getBoundingClientRect();
        origX = rect.left; origY = rect.top;
        sprite.style.animation = 'none';
    }, { passive: true });
    document.addEventListener('touchmove', e => {
        if (!dragging) return;
        const dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
        sprite.style.left = (origX + dx) + 'px';
        sprite.style.top = (origY + dy) + 'px';
        sprite.style.right = 'auto'; sprite.style.bottom = 'auto';
    }, { passive: true });
    document.addEventListener('touchend', () => {
        if (dragging) {
            dragging = false;
            sprite.style.animation = '';
        }
    });

    sprite.addEventListener('click', e => {
        if (hasMoved) return;
        playSpriteAction();
    });

    // 定时自娱自乐
    setInterval(() => {
        if (!dragging && isLoggedIn) {
            const r = Math.random();
            if (r < 0.2) spriteRoll();
            else if (r < 0.4) spriteJump();
            else if (r < 0.55) spriteSpin();
            else if (r < 0.7) spriteBubble(randomTip());
            else if (r < 0.85) spriteWave();
            else randomSpritePose();
        }
    }, 12000);
}

function setSpritePose(pose) {
    const img = document.getElementById('sprite-img');
    if (img && SPRITE_POSES[pose]) {
        img.src = SPRITE_POSES[pose];
    }
}

function randomSpritePose() {
    const poses = Object.keys(SPRITE_POSES);
    const pose = poses[Math.floor(Math.random() * poses.length)];
    setSpritePose(pose);
}

function playSpriteAction() {
    const actions = ['roll', 'jump', 'spin', 'wave'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const messages = [
        '你好呀！',
        '今天天气真好~',
        '来玩呀！',
        '好开心见到你！',
        '今天也要元气满满！',
        '想你啦~',
        '抱抱~',
        '蹦蹦跳跳~',
        '一起玩吧！',
        '开心每一天！',
        '我在这儿呢~',
        '你今天真好看！'
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    switch(action) {
        case 'roll': spriteRoll(); break;
        case 'jump': spriteJump(); break;
        case 'spin': spriteSpin(); break;
        case 'wave': spriteWave(); break;
    }

    // 点击时随机切换姿态
    randomSpritePose();
    spriteBubble(msg);
}

function spriteRoll() {
    const sprite = document.getElementById('sprite');
    sprite.classList.add('rolling');
    setTimeout(() => sprite.classList.remove('rolling'), 1000);
}

function spriteJump() {
    const sprite = document.getElementById('sprite');
    setSpritePose('jumping');
    sprite.classList.add('jumping');
    setTimeout(() => sprite.classList.remove('jumping'), 800);
}

function spriteSpin() {
    const sprite = document.getElementById('sprite');
    sprite.classList.add('spinning');
    setTimeout(() => sprite.classList.remove('spinning'), 800);
}

function spriteWave() {
    const sprite = document.getElementById('sprite');
    setSpritePose('cheering');
    sprite.classList.add('waving');
    setTimeout(() => sprite.classList.remove('waving'), 1000);
}

function spriteBubble(msg) {
    const bubble = document.getElementById('sprite-bubble');
    bubble.textContent = msg;
    bubble.classList.remove('hidden');
    setTimeout(() => bubble.classList.add('hidden'), 3000);
}

function randomTip() {
    const tips = [
        '今天过得开心吗？',
        '记得多喝水哦~',
        '保持好心情！',
        '要好好休息~',
        '想聊聊天吗？',
        '我一直在你身边~',
        '笑一笑，十年少~',
        '生活很美好！',
        '加油哦！',
        '你真棒！',
        '爱你哟~',
        '今天也要开心！'
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

function showSprite() {
    document.getElementById('sprite').classList.remove('hidden');
}

function hideSprite() {
    document.getElementById('sprite').classList.add('hidden');
}

// ========== 欢迎弹窗 + 语音 ==========
function showWelcome() {
    const welcomeMessages = [
        '欢迎回来！今天也要开开心心的哦~',
        '你回来啦！我好想你~',
        '嗨！今天过得怎么样？',
        '欢迎回来！我一直在等你~'
    ];
    const msg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    document.getElementById('welcome-msg').textContent = msg;
    document.getElementById('welcome-modal').classList.remove('hidden');
    playWelcomeVoice(msg);
    spriteJump();
    setSpritePose('jumping');
}

function closeWelcome() {
    document.getElementById('welcome-modal').classList.add('hidden');
    setSpritePose('cheering');
}

function playWelcomeVoice(text) {
    try {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.95;
            utterance.pitch = 1.05;
            utterance.volume = 0.9;
            utterance.range = 0;

            const voices = window.speechSynthesis.getVoices();

            const preferredVoices = [
                'Google 普通话',
                'Google 中文',
                'Microsoft Xiaoxiao - Chinese (Simplified, China)',
                'Microsoft Yaoyao - Chinese (Simplified, China)',
                'Microsoft Liulian - Chinese (Simplified, China)',
                'Microsoft Yunxi - Chinese (Simplified, China)',
                'Microsoft Yanxi - Chinese (Simplified, China)',
                'Microsoft Yaqian - Chinese (Simplified, China)',
                'Microsoft Yunyang - Chinese (Simplified, China)',
                'Tingting',
                'Sinji',
                'Lili',
                'Meimei',
                'XiaoXiao',
                'Yunxi',
                'Xiaoxiao'
            ];

            let selectedVoice = null;
            for (const name of preferredVoices) {
                selectedVoice = voices.find(v => 
                    v.name.includes(name) || v.name.includes(name.replace(' ', ''))
                );
                if (selectedVoice) break;
            }

            if (!selectedVoice) {
                selectedVoice = voices.find(v => 
                    v.lang === 'zh-CN' || 
                    v.lang === 'zh_CN' || 
                    v.lang.includes('zh') && v.name.includes('Female')
                );
            }

            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.includes('zh'));
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            window.speechSynthesis.speak(utterance);
        }
    } catch (e) { /* 忽略语音错误 */ }
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [880, 1100, 1320, 1100];
        const durations = [0.1, 0.1, 0.1, 0.2];
        let t = ctx.currentTime;
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
            gain.gain.linearRampToValueAtTime(0, t + durations[i]);
            osc.start(t); osc.stop(t + durations[i]);
            t += durations[i];
        });
    } catch (e) { /* 忽略 */ }
}

// ========== OCR 拍照识别 ==========
function scanMedicineName() { scanFromCamera('medicine-name'); }
function scanExpiryDate() { scanFromCamera('expiry-date'); }

const BAIDU_OCR_TOKEN = null;
let baiduTokenExpiry = 0;

function scanFromCamera(targetField) {
    openCameraOverlay(targetField);
}

async function getBaiduOCRToken() {
    if (BAIDU_OCR_TOKEN && Date.now() < baiduTokenExpiry) {
        return BAIDU_OCR_TOKEN;
    }
    
    if (!window.BAIDU_OCR_API_KEY || !window.BAIDU_OCR_SECRET_KEY) {
        return { success: false, error: '未配置百度API Key' };
    }
    
    try {
        const response = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${window.BAIDU_OCR_API_KEY}&client_secret=${window.BAIDU_OCR_SECRET_KEY}`);
        const data = await response.json();
        console.log('Token response:', data);
        if (data.access_token) {
            BAIDU_OCR_TOKEN = data.access_token;
            baiduTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
            return { success: true, token: data.access_token };
        } else {
            return { success: false, error: '获取token失败: ' + (data.error_description || data.error || '未知错误') };
        }
    } catch (err) {
        console.error('获取百度OCR token失败:', err);
        return { success: false, error: '网络错误: ' + err.message };
    }
}

async function recognizeWithBaiduOCR(imageBase64, targetField) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    try {
        const response = await fetch(
            'http://localhost:8081/api/ocr',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageBase64,
                    apiKey: window.BAIDU_OCR_API_KEY,
                    secretKey: window.BAIDU_OCR_SECRET_KEY
                }),
                signal: controller.signal
            }
        );
        clearTimeout(timeout);
        
        const data = await response.json();
        console.log('百度OCR响应:', data);
        
        if (data.words_result && data.words_result.length > 0) {
            const text = data.words_result.map(item => item.words).join('\n');
            console.log('百度OCR文本:', text);
            return {
                text: text,
                words: data.words_result.map(item => ({
                    text: item.words,
                    bbox: item.location ? {
                        x1: item.location.left,
                        y1: item.location.top,
                        x2: item.location.left + item.location.width,
                        y2: item.location.top + item.location.height
                    } : null
                }))
            };
        }
        
        if (data.error_code) {
            console.error('百度OCR错误:', data.error_code, data.error_msg);
            if (String(data.error_code) === '110' || String(data.error_code) === '111') {
                BAIDU_OCR_TOKEN = null;
            }
        }
        
        if (!data.words_result || data.words_result.length === 0) {
            console.warn('百度OCR未识别到文字');
        }
    } catch (err) {
        clearTimeout(timeout);
        console.error('百度OCR请求失败:', err.name, err.message);
    }
    return null;
}

function openCameraOverlay(targetField) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;';
    document.body.appendChild(overlay);

    const video = document.createElement('video');
    video.style.cssText = 'width:100%;max-width:500px;'; 
    video.autoplay = true; 
    video.playsInline = true;
    video.muted = true;

    const status = document.createElement('p');
    status.textContent = '正在启动相机...'; 
    status.style.cssText = 'color:white;font-size:16px;margin-top:15px;text-align:center;';

    const captureBtn = document.createElement('button');
    captureBtn.textContent = '拍照识别'; 
    captureBtn.style.cssText = 'margin-top:20px;padding:15px 40px;font-size:18px;background:#F07050;color:white;border:none;border-radius:30px;cursor:pointer;font-weight:700;display:none;';

    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = '从相册选择'; 
    uploadBtn.style.cssText = 'margin-top:10px;padding:10px 30px;font-size:14px;background:transparent;color:white;border:1px solid white;border-radius:20px;cursor:pointer;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭'; 
    closeBtn.style.cssText = 'margin-top:15px;padding:10px 30px;font-size:14px;background:transparent;color:#FF6B6B;border:1px solid #FF6B6B;border-radius:20px;cursor:pointer;';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = 'display:none;';

    overlay.append(video, status, captureBtn, uploadBtn, closeBtn, fileInput);

    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        uploadBtn.disabled = true;
        captureBtn.disabled = true;
        status.textContent = '正在识别...';
        try {
            const img = await loadImage(file);
            const canvas = createCanvasFromImage(img);
            await performOCRWithFallback(canvas, targetField, status);
        } catch (err) {
            alert('识别失败: ' + (err.message || err.toString() || '未知错误'));
        }
        document.body.removeChild(overlay);
    };

    closeBtn.onclick = () => {
        if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
        document.body.removeChild(overlay);
    };

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
        .then(stream => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                status.textContent = '准备就绪，请对准药品包装';
                captureBtn.style.display = 'block';
            };
        })
        .catch(err => {
            status.textContent = '无法访问摄像头，请从相册选择图片';
            console.error('Camera error:', err);
        });

    captureBtn.onclick = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        
        try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            alert('拍照失败，请重试');
            return;
        }

        if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());

        captureBtn.disabled = true;
        uploadBtn.disabled = true;
        status.textContent = '正在识别...';

        try {
            await performOCRWithFallback(canvas, targetField, status);
        } catch (err) {
            alert('识别失败: ' + (err.message || err.toString() || '未知错误'));
        }
        
        document.body.removeChild(overlay);
    };
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

function createCanvasFromImage(img) {
    const minDim = 2400;
    let width = img.width;
    let height = img.height;
    
    if (width < minDim && height < minDim) {
        const ratio = Math.max(minDim / width, minDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
}

function preprocessImage(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 第一步：灰度化
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        gray[i >> 2] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    
    // 第二步：自适应阈值
    const result = new Uint8Array(width * height);
    const blockSize = Math.max(10, Math.floor(width / 25));
    const C = 5;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;
            const yStart = Math.max(0, y - blockSize);
            const yEnd = Math.min(height, y + blockSize + 1);
            const xStart = Math.max(0, x - blockSize);
            const xEnd = Math.min(width, x + blockSize + 1);
            
            for (let by = yStart; by < yEnd; by++) {
                for (let bx = xStart; bx < xEnd; bx++) {
                    sum += gray[by * width + bx];
                    count++;
                }
            }
            
            const mean = sum / count;
            result[y * width + x] = gray[y * width + x] < (mean - C) ? 0 : 255;
        }
    }
    
    // 第三步：去噪（轻微腐蚀/膨胀去除孤立点）
    const denoised = new Uint8Array(result);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            let blackNeighbors = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (result[(y + dy) * width + (x + dx)] === 0) blackNeighbors++;
                }
            }
            // 孤立白点变黑，孤立黑点变白
            if (result[idx] === 255 && blackNeighbors >= 7) {
                denoised[idx] = 0;
            } else if (result[idx] === 0 && blackNeighbors <= 2) {
                denoised[idx] = 255;
            }
        }
    }
    
    for (let i = 0; i < data.length; i += 4) {
        const val = denoised[i >> 2];
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

async function performOCRWithFallback(canvas, targetField, statusElement) {
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    console.log('图片Base64大小:', (imageBase64.length / 1024).toFixed(1), 'KB');
    
    let result = null;
    let baiduError = null;
    
    if (window.BAIDU_OCR_API_KEY && window.BAIDU_OCR_API_KEY !== '') {
        statusElement.textContent = '正在使用云端识别...';
        try {
            result = await recognizeWithBaiduOCR(imageBase64, targetField);
            if (result) {
                statusElement.textContent = '云端识别完成';
                console.log('百度OCR成功');
            } else {
                baiduError = '云端识别未返回结果';
                statusElement.textContent = '云端识别失败，切换本地识别...';
            }
        } catch (err) {
            baiduError = err.message || '云端识别异常';
            console.error('百度OCR异常:', err);
            statusElement.textContent = '云端识别失败，切换本地识别...';
        }
    }
    
    if (!result && typeof Tesseract !== 'undefined') {
        statusElement.textContent = '正在使用本地识别...';
        result = await performLocalOCR(canvas, statusElement);
    }
    
    if (!result || !result.text || !result.text.trim()) {
        const msg = baiduError ? `云端识别失败，本地也未能识别文字。请调整角度后重试。` : '未能识别文字，请调整角度后重试';
        throw new Error(msg);
    }
    
    console.log('最终识别文本:', result.text);
    processResult(targetField, result);
}

async function performLocalOCR(canvas, statusElement) {
    const processedCanvas = preprocessImage(canvas);
    let finalResult = null;
    let maxConfidence = 0;

    const configs = [
        { lang: 'chi_sim', psm: Tesseract.PSM.SINGLE_BLOCK, desc: '单块模式' },
        { lang: 'chi_sim', psm: Tesseract.PSM.SPARSE_TEXT, desc: '稀疏文本' },
        { lang: 'chi_sim+chi_tra', psm: Tesseract.PSM.SINGLE_BLOCK, desc: '简体+繁体' },
        { lang: 'chi_sim', psm: Tesseract.PSM.AUTO, desc: '自动模式' }
    ];

    for (const config of configs) {
        try {
            statusElement.textContent = `识别中...`;
            const result = await Tesseract.recognize(
                processedCanvas,
                config.lang,
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            statusElement.textContent = `识别中: ${Math.round(m.progress * 100)}%`;
                        }
                    },
                    tessedit_pageseg_mode: config.psm
                }
            );

            if (result && result.data && result.data.text && result.data.text.trim()) {
                const text = result.data.text.trim();
                const confidence = result.data.confidence || 0;
                console.log(`${config.desc}: "${text}" (置信度: ${confidence}%)`);
                
                if (confidence > maxConfidence || (!finalResult && text.length > 0)) {
                    finalResult = result;
                    maxConfidence = confidence;
                }
                
                if (confidence >= 60 && text.length >= 3) {
                    break;
                }
            }
        } catch (err) {
            console.error(`${config.desc}失败:`, err);
        }
    }

    if (!finalResult) {
        return { text: '', words: [] };
    }

    return finalResult.data;
}

function processResult(targetField, ocrData) {
    const recognizedText = (ocrData.text || '').trim();
    const words = ocrData.words || [];

    console.log('OCR文本:', recognizedText);
    console.log('OCR词列表:', words);

    if (!recognizedText && words.length === 0) {
        alert('未识别到文字，请调整角度后重试');
        return;
    }

    if (targetField === 'medicine-name') {
        let allLines = [];
        
        if (recognizedText) {
            allLines = recognizedText.split('\n')
                .map(l => cleanMedicineName(l))
                .filter(l => l.length >= 1);
        }
        
        if (allLines.length === 0) {
            alert('未识别到药品名称，请手动输入');
            return;
        }
        
        // 第一步：所有行做字典匹配，取匹配度最高且最长的
        let bestMatch = null;
        let bestMatchScore = 0;
        for (const line of allLines) {
            const match = findBestMedicineMatch(line);
            if (match) {
                const score = calculateSimilarity(line, match);
                if (score > bestMatchScore || (score === bestMatchScore && match.length > (bestMatch ? bestMatch.length : 0))) {
                    bestMatchScore = score;
                    bestMatch = match;
                }
            }
        }
        
        // 第二步：没有匹配到字典，找中文最多、长度适中(2-10字)的行
        let bestLine = '';
        let bestLineScore = 0;
        for (const line of allLines) {
            const chineseCount = (line.match(/[\u4e00-\u9fa5]/g) || []).length;
            const totalLen = line.length;
            const chineseRatio = totalLen > 0 ? chineseCount / totalLen : 0;
            let score = chineseRatio * 10 + chineseCount;
            if (chineseCount >= 2 && chineseCount <= 10) score += 5;
            if (chineseCount >= 3 && chineseCount <= 6) score += 3;
            if (score > bestLineScore) {
                bestLineScore = score;
                bestLine = line;
            }
        }
        
        let suggestedName = bestMatch || (bestLine || allLines[0]).replace(/[a-zA-Z0-9\s]/g, '');
        if (!suggestedName || suggestedName.length < 2) {
            suggestedName = bestLine || allLines[0];
        }
        
        // 显示识别栏，让用户选择或修改
        showOcrPanel(allLines, suggestedName);
    } else {
        const expiryDate = extractExpiryDate(words, recognizedText);
        if (expiryDate) {
            document.getElementById('expiry-date').value = expiryDate;
            alert(`识别有效期：${expiryDate}`);
        } else {
            alert('未识别到有效期，请手动选择');
        }
    }
}

// ========== 图片识别栏交互 ==========
function showOcrPanel(allLines, suggestedName) {
    const panel = document.getElementById('ocr-panel');
    const rawTextEl = document.getElementById('ocr-raw-text');
    const editInput = document.getElementById('ocr-edit-input');
    if (!panel || !rawTextEl || !editInput) return;

    // 渲染所有识别行，点击可填入输入框
    rawTextEl.innerHTML = '';
    const uniqueLines = [...new Set(allLines.filter(l => l && l.trim().length >= 1))];
    if (uniqueLines.length === 0) {
        rawTextEl.innerHTML = '<p style="font-size:13px;color:#A1887F;text-align:center;padding:8px;">未识别到文字</p>';
    } else {
        uniqueLines.forEach((line, idx) => {
            const lineEl = document.createElement('div');
            lineEl.className = 'ocr-raw-line';
            lineEl.textContent = line;
            lineEl.setAttribute('data-line', line);
            // 默认选中建议项
            if (line === suggestedName) {
                lineEl.classList.add('selected');
            }
            lineEl.addEventListener('click', () => {
                rawTextEl.querySelectorAll('.ocr-raw-line').forEach(el => el.classList.remove('selected'));
                lineEl.classList.add('selected');
                editInput.value = line;
            });
            rawTextEl.appendChild(lineEl);
        });
    }

    // 预填建议名称
    editInput.value = suggestedName || '';
    panel.style.display = 'block';

    // 自动聚焦输入框方便修改
    setTimeout(() => { editInput.focus(); editInput.select(); }, 100);
}

function applyOcrResult() {
    const editInput = document.getElementById('ocr-edit-input');
    const panel = document.getElementById('ocr-panel');
    if (!editInput || !panel) return;

    const value = editInput.value.trim();
    if (!value) {
        alert('请输入或选择药品名称');
        return;
    }

    document.getElementById('medicine-name').value = value;
    panel.style.display = 'none';
}

function closeOcrPanel() {
    const panel = document.getElementById('ocr-panel');
    if (panel) panel.style.display = 'none';
}

function findBestMedicineMatch(text) {
    if (!text || text.length < 2) return null;
    
    let bestMatch = null;
    let bestScore = 0;
    
    const cleaned = cleanMedicineName(text);
    
    for (const medicine of COMMON_MEDICINES) {
        if (medicine === cleaned) return medicine;
        
        const score = calculateSimilarity(cleaned, medicine);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = medicine;
        }
    }
    
    const threshold = cleaned.length >= 4 ? 0.35 : 0.5;
    console.log(`字典匹配: "${cleaned}" -> "${bestMatch}" (得分: ${bestScore.toFixed(2)}, 阈值: ${threshold})`);
    
    return bestScore >= threshold ? bestMatch : null;
}

function calculateSimilarity(str1, str2) {
    const s1 = str1.replace(/\s/g, '');
    const s2 = str2.replace(/\s/g, '');
    
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    const len1 = s1.length;
    const len2 = s2.length;
    const maxLen = Math.max(len1, len2);
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    
    const distance = matrix[len1][len2];
    return 1 - distance / maxLen;
}

function cleanMedicineName(name) {
    return name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '').trim();
}

const COMMON_MEDICINES = [
    '藿香正气水', '藿香正气胶囊', '藿香正气口服液', '藿香正气丸',
    '甲硝唑凝胶', '甲硝唑片', '甲硝唑',
    '感冒灵颗粒', '复方感冒灵',
    '布洛芬', '布洛芬缓释胶囊', '布洛芬颗粒',
    '阿莫西林', '阿莫西林胶囊',
    '板蓝根', '板蓝根颗粒',
    '头孢', '头孢克肟', '头孢拉定', '头孢氨苄',
    '蒙脱石散',
    '健胃消食片', '健胃消食口服液',
    '云南白药', '云南白药气雾剂',
    '创可贴', '酒精', '碘伏',
    '红霉素', '红霉素软膏',
    '维生素C', '维生素B', '钙片',
    '双黄连', '双黄连口服液',
    '银翘片', '维C银翘片',
    '牛黄解毒片', '牛黄解毒丸',
    '奥美拉唑', '奥美拉唑肠溶胶囊',
    '吗丁啉', '多潘立酮',
    '达喜', '铝碳酸镁',
    '整肠生', '益生菌',
    '复方丹参片', '丹参片',
    '速效救心丸',
    '硝酸甘油',
    '阿司匹林',
    '左氧氟沙星', '诺氟沙星',
    '金嗓子喉片', '西瓜霜',
    '皮炎平', '糠酸莫米松',
    '红霉素眼膏', '氯霉素滴眼液',
    '炉甘石', '红霉素软膏', '莫匹罗星软膏',
    '降压药', '降糖药', '止痛药', '退烧药', '消炎药', '止泻药', '抗过敏药', '止咳药', '感冒药'
];

function fuzzyCorrectMedicineName(text) {
    if (!text || text.length < 2) return text;
    
    const cleaned = cleanMedicineName(text);
    
    for (const medicine of COMMON_MEDICINES) {
        if (cleaned === medicine) return medicine;
    }
    
    let bestScore = 0;
    let bestMatch = null;
    for (const medicine of COMMON_MEDICINES) {
        const score = calculateSimilarity(cleaned, medicine);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = medicine;
        }
    }
    
    if (bestScore >= 0.5) return bestMatch;
    
    if (cleaned.length >= 4 && bestScore >= 0.4) return bestMatch;
    
    return cleaned;
}

function extractLargestText(words) {
    if (!words || words.length === 0) return null;

    const wordsWithHeight = words.filter(w => w.bbox && typeof w.bbox.y1 === 'number' && typeof w.bbox.y2 === 'number');
    
    if (wordsWithHeight.length === 0) {
        return words[0].text || null;
    }

    const lines = [];
    const sortedWords = [...wordsWithHeight].sort((a, b) => {
        const ya = (a.bbox.y1 + a.bbox.y2) / 2;
        const yb = (b.bbox.y1 + b.bbox.y2) / 2;
        return ya - yb;
    });

    let currentLine = [sortedWords[0]];
    for (let i = 1; i < sortedWords.length; i++) {
        const prevWord = currentLine[currentLine.length - 1];
        const currWord = sortedWords[i];
        const prevY = (prevWord.bbox.y1 + prevWord.bbox.y2) / 2;
        const currY = (currWord.bbox.y1 + currWord.bbox.y2) / 2;
        const avgHeight = (prevWord.bbox.y2 - prevWord.bbox.y1 + currWord.bbox.y2 - currWord.bbox.y1) / 2;
        
        if (Math.abs(currY - prevY) < avgHeight * 0.5) {
            currentLine.push(currWord);
        } else {
            lines.push(currentLine);
            currentLine = [currWord];
        }
    }
    lines.push(currentLine);

    let maxAvgHeight = 0;
    let largestLine = [];
    
    const sortedLines = lines.map(line => {
        let totalHeight = 0;
        line.forEach(word => {
            totalHeight += (word.bbox.y2 - word.bbox.y1);
        });
        const avgHeight = totalHeight / line.length;
        
        if (avgHeight > maxAvgHeight) {
            maxAvgHeight = avgHeight;
            largestLine = line;
        }
        
        line.sort((a, b) => a.bbox.x1 - b.bbox.x1);
        const text = line.map(w => w.text || '').join('').trim();
        return { text, avgHeight };
    }).sort((a, b) => b.avgHeight - a.avgHeight);

    // 优先在最大的几行中查找字典匹配
    for (const lineInfo of sortedLines.slice(0, 3)) {
        const matched = findBestMedicineMatch(lineInfo.text);
        if (matched) {
            console.log('最大字体行中匹配到字典:', lineInfo.text, '->', matched);
            return matched;
        }
    }

    // 没有匹配则返回最大字体行原文
    if (sortedLines.length > 0) {
        const result = sortedLines[0].text;
        console.log('识别到最大字体行:', result);
        return result;
    }

    return null;
}

function extractExpiryDate(words, fullText) {
    const keywords = ['有效期至', '有效期:', '有效期到', '有效期', '至', '有效期至:', '截止日期', '失效日期', '效期', '有效期至：', 'EXP:', 'EXP DATE:', 'EXPIRY:', 'VALID UNTIL:', '到期日'];
    
    for (const keyword of keywords) {
        const index = fullText.indexOf(keyword);
        if (index !== -1) {
            const textAfterKeyword = fullText.substring(index + keyword.length);
            const date = parseDateFromText(textAfterKeyword);
            if (date) return date;
        }
    }

    if (words && words.length > 0) {
        for (let i = 0; i < words.length; i++) {
            const wordText = words[i].text || '';
            for (const keyword of keywords) {
                if (wordText.includes(keyword)) {
                    let remainingText = '';
                    for (let j = i; j < Math.min(i + 8, words.length); j++) {
                        remainingText += (words[j].text || '') + ' ';
                    }
                    const date = parseDateFromText(remainingText);
                    if (date) return date;
                }
            }
        }
    }

    return parseDateFromText(fullText);
}

function parseDateFromText(text) {
    const patterns = [
        /(\d{4})[年\-/](\d{1,2})[月\-/](\d{1,2})[日号]?/,
        /(\d{4})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})/,
        /(\d{4})\s*[\.\-\/]\s*(\d{1,2})\s*[\.\-\/]\s*(\d{1,2})/,
        /(\d{4})(\d{2})(\d{2})/,
        /(\d{2})[年\-/](\d{1,2})[月\-/](\d{1,2})[日号]?/,
        /(\d{2})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})/,
        /(\d{2})(\d{2})(\d{2})/,
        /(\d{1,2})[月](\d{1,2})[日][\s\S]*(\d{4})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{1,2})\-(\d{1,2})\-(\d{4})/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let year = match[1];
            let month = match[2];
            let day = match[3];
            
            if (year.length === 1) year = '200' + year;
            else if (year.length === 2) year = '20' + year;
            
            if (parseInt(year) < 2000) year = '20' + year;
            
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    return null;
}

// ========== 分享链接导入 ==========
function handleShareLink() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
        try {
            const decoded = decodeURIComponent(escape(atob(data)));
            const shareData = JSON.parse(decoded);
            if (shareData.medicines && shareData.medicines.length > 0) {
                if (confirm('检测到分享的药品数据，是否要导入？')) {
                    medicines = medicines.concat(shareData.medicines);
                    saveMedicines(); renderHomePage();
                }
            }
        } catch (e) { /* 忽略 */ }
    }
}

// ========== 启动应用 ==========
init();
handleShareLink();
setInterval(checkExpiryReminders, 60 * 60 * 1000);
