// js/admin.js - 修復手機一般模式帳號同步、支援修改後台密碼、一鍵匯出 data.js、批次移動樓層

const AdminModule = {
    isAuthenticated: false,
    editingUser: null,
    editingId: null,
    filterFloor: 'ALL',

    render() {
        const container = document.getElementById('view-admin');

        if (!this.isAuthenticated) {
            container.innerHTML = `
                <div class="glass-card" style="max-width:480px; margin:40px auto;">
                    <h2>🔒 天空競技場・管理員後台驗證</h2>
                    <p style="color:var(--text-muted); margin:10px 0 18px;">請輸入後台管理員密碼以進行系統設定</p>
                    <div class="form-group">
                        <input type="password" id="admin-pwd-input" placeholder="請輸入管理員密碼">
                    </div>
                    <button class="btn-primary full-width" onclick="AdminModule.login()">解鎖後台設定</button>
                </div>
            `;
            return;
        }

        const users = DataStore.getUsers();
        const questions = DataStore.getQuestions();
        const targetUser = this.editingUser ? users.find(u => u.username === this.editingUser) : null;

        const floorGroups = {};
        questions.forEach(q => {
            const f = Number(q.floor) || 1;
            if (!floorGroups[f]) floorGroups[f] = [];
            floorGroups[f].push(q);
        });
        const sortedFloors = Object.keys(floorGroups).map(Number).sort((a, b) => a - b);

        const displayFloors = this.filterFloor === 'ALL'
            ? sortedFloors
            : sortedFloors.filter(f => String(f) === String(this.filterFloor));

        const editingQuestion = this.editingId ? questions.find(q => q.id === this.editingId) : null;

        container.innerHTML = `
            <div class="lobby-grid" style="margin-bottom:20px;">
                <div class="glass-card" style="background:rgba(56, 189, 248, 0.1); border-color:var(--accent-blue); margin-bottom:0;">
                    <h3 style="color:var(--accent-blue); margin-bottom:6px;">📦 網站題庫與名單雲端同步工具</h3>
                    <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:12px;">匯入題庫或新增挑戰者帳號後，點擊下方按鈕打包並覆蓋回專案 js/data.js。</p>
                    <button class="btn-primary full-width" onclick="AdminModule.exportDataJsFile()" style="background:linear-gradient(135deg, #38bdf8, #0284c7); color:#fff;">
                        📦 匯出最新 data.js (強制同步至全體業務手機)
                    </button>
                </div>

                <div class="glass-card" style="background:rgba(245, 158, 11, 0.1); border-color:var(--gold); margin-bottom:0;">
                    <h3 style="color:var(--gold-light); margin-bottom:6px;">🔑 修改後台管理員密碼</h3>
                    <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:10px;">變更進入此管理後台的安全驗證密碼（匯出 data.js 時會一併同步）。</p>
                    <div style="display:flex; gap:8px;">
                        <input type="password" id="new-admin-pwd" placeholder="請輸入新後台密碼" style="flex:1;">
                        <button class="btn-primary" onclick="AdminModule.changeAdminPassword()" style="white-space:nowrap;">更新密碼</button>
                    </div>
                </div>
            </div>

            <div class="lobby-grid">
                <!-- 左欄：新增 / 編輯挑戰者帳號 -->
                <div class="glass-card" id="user-form-card">
                    <h3>${targetUser ? `✏️ 編輯挑戰者【${targetUser.nickname}】` : '👤 新增挑戰者帳號與初始屬性頭像'}</h3>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px;">
                        <div class="form-group">
                            <label>挑戰者登入帳號 ${targetUser ? '<small style="color:var(--text-muted);">(不可改)</small>' : ''}</label>
                            <input type="text" id="new-username" value="${targetUser ? targetUser.username : ''}" ${targetUser ? 'readonly style="opacity:0.6; cursor:not-allowed;"' : ''} placeholder="例如：sales01">
                        </div>
                        <div class="form-group">
                            <label>挑戰者登入密碼</label>
                            <input type="text" id="new-password" value="${targetUser ? targetUser.password : ''}" placeholder="例如：1234">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>業務挑戰者暱稱</label>
                        <input type="text" id="new-nickname" value="${targetUser ? targetUser.nickname : ''}" placeholder="例如：王小明">
                    </div>

                    <div class="form-group">
                        <label>選擇念能力屬性</label>
                        <select id="new-role">
                            ${AVATAR_CONFIG.map((a, i) => `
                                <option value="${a.id}" ${targetUser && targetUser.roleId === a.id ? 'selected' : ''}>
                                    ${i + 1}. ${a.name}（${a.nen} - ${a.attackName}）
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div class="form-group">
                            <label>所在樓層 (>=30 解鎖自訂頭像)</label>
                            <input type="number" id="new-floor" value="${targetUser ? targetUser.floor : 1}" min="1" max="200">
                        </div>
                        <div class="form-group">
                            <label>累積勝場數</label>
                            <input type="number" id="new-wins" value="${targetUser ? (targetUser.wins || 0) : 0}" min="0">
                        </div>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button class="btn-primary full-width" onclick="AdminModule.saveUser()">
                            ${targetUser ? '💾 儲存挑戰者修改' : '➕ 新增挑戰者帳號'}
                        </button>
                        ${targetUser ? `
                            <button class="btn-secondary" style="white-space:nowrap;" onclick="AdminModule.cancelEditUser()">取消編輯</button>
                        ` : ''}
                    </div>

                    <hr style="margin:18px 0; border-color:rgba(255,255,255,0.15);">

                    <h4>📋 目前挑戰者清單 (${users.length} 人)</h4>
                    <div style="max-height:260px; overflow-y:auto; margin-top:10px;">
                        ${users.map(u => {
                            const info = DataStore.getAvatarInfo(u);
                            const isEditingThis = this.editingUser === u.username;
                            return `
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid rgba(255,255,255,0.1); background:${isEditingThis ? 'rgba(245,158,11,0.18)' : 'transparent'}; border-radius:8px; gap:8px;">
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <img src="${info.displayImg}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; background:#fff; border:2px solid var(--gold);" onerror="this.src='assets/avatars/全能巨星.jpg'">
                                        <div>
                                            <div style="font-size:0.95rem;">
                                                <strong>${u.nickname}</strong> <small style="color:var(--text-muted);">(@${u.username})</small>
                                            </div>
                                            <div style="font-size:0.8rem; margin-top:2px;">
                                                <span class="nen-tag ${info.nenClass}" style="padding:1px 6px; font-size:0.7rem;">${info.nen}</span>
                                                <span style="color:var(--gold-light); font-weight:800; margin-left:6px;">🗼 ${u.floor}F</span>
                                                <span style="color:#38bdf8; margin-left:6px;">🏅 ${u.wins || 0} 勝</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="display:flex; gap:6px; flex-shrink:0;">
                                        <button class="btn-secondary" style="padding:4px 10px; font-size:0.8rem;" onclick="AdminModule.startEditUser('${u.username}')">✏️ 編輯</button>
                                        <button class="btn-danger" style="padding:4px 10px; font-size:0.8rem;" onclick="AdminModule.deleteUser('${u.username}')">刪除</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 右欄：批次匯入 ＋ 手動新增/編輯表單 -->
                <div class="glass-card" id="question-form-card">
                    <h3>📂 批次匯入擂台題目 (支援 EXCEL / TXT / PDF)</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin:8px 0 14px; line-height:1.6;">
                        • <strong>Excel 標準 9 欄格式</strong>：<br>
                        <code>A樓層 | B樓層名稱 | C題目 | D選項A | E選項B | F選項C | G選項D | H答案 | I解析</code>
                    </p>
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <input type="file" id="file-import" accept=".xlsx,.xls,.csv,.txt,.pdf" onchange="AdminModule.handleFileImport(event)" style="flex:1;">
                        <button class="btn-danger" onclick="AdminModule.clearAllQuestions()">🗑️ 一鍵刪除所有題目</button>
                    </div>

                    <hr style="margin:18px 0; border-color:rgba(255,255,255,0.15);">

                    <h3>${editingQuestion ? '✏️ 編輯題目詳細內容' : '✍️ 手動新增單筆樓層題目'}</h3>
                    <div style="display:grid; grid-template-columns:1fr 2fr; gap:10px; margin-top:10px;">
                        <div class="form-group">
                            <label>所屬樓層</label>
                            <input type="number" id="q-floor" value="${editingQuestion ? editingQuestion.floor : 1}" min="1" max="200">
                        </div>
                        <div class="form-group">
                            <label>樓層名稱（商品名稱）</label>
                            <input type="text" id="q-floor-name" value="${editingQuestion ? (editingQuestion.floorName || '') : ''}" placeholder="例如：自由配住院">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>題目內容</label>
                        <textarea id="q-text" rows="2" placeholder="請輸入商品訓練題目...">${editingQuestion ? editingQuestion.question : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>選項 A ~ D（每行一個選項）</label>
                        <textarea id="q-options" rows="4" placeholder="A. 選項內容一\nB. 選項內容二\nC. 選項內容三\nD. 選項內容四">${editingQuestion ? (editingQuestion.options || []).join('\n') : ''}</textarea>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 2fr; gap:10px;">
                        <div class="form-group">
                            <label>正確答案 (A/B/C/D)</label>
                            <input type="text" id="q-ans" value="${editingQuestion ? editingQuestion.answer : ''}" placeholder="A">
                        </div>
                        <div class="form-group">
                            <label>專業詳解</label>
                            <input type="text" id="q-exp" value="${editingQuestion ? (editingQuestion.explanation || '') : ''}" placeholder="賽後顯示的完整商品解析...">
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-primary full-width" onclick="AdminModule.saveQuestionForm()">
                            ${editingQuestion ? '💾 儲存題目修改' : '➕ 新增題目至題庫'}
                        </button>
                        ${editingQuestion ? `
                            <button class="btn-secondary" style="white-space:nowrap;" onclick="AdminModule.cancelEdit()">取消編輯</button>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- 下方：依「樓層」分類的題庫管理總覽 -->
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
                    <div>
                        <h3 style="display:inline-block; margin-right:12px;">📚 樓層分類題庫管理 (共 ${sortedFloors.length} 個樓層 / ${questions.length} 道題目)</h3>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <select onchange="AdminModule.setFloorFilter(this.value)" style="width:auto; min-width:180px; padding:8px 12px;">
                            <option value="ALL" ${this.filterFloor === 'ALL' ? 'selected' : ''}>🔍 顯示全部樓層 (${questions.length}題)</option>
                            ${sortedFloors.map(f => {
                                const fName = floorGroups[f][0].floorName || `第 ${f} 層`;
                                return `<option value="${f}" ${String(this.filterFloor) === String(f) ? 'selected' : ''}>第 ${f} 層｜${fName} (${floorGroups[f].length}題)</option>`;
                            }).join('')}
                        </select>
                        <button class="btn-danger" onclick="AdminModule.clearAllQuestions()">🗑️ 一鍵刪除所有題目</button>
                    </div>
                </div>

                ${displayFloors.length === 0 ? `
                    <div style="text-align:center; padding:30px; color:var(--text-muted); border:1px dashed rgba(255,255,255,0.2); border-radius:12px;">
                        目前尚無任何題目，請從上方匯入 Excel 題庫或手動新增！
                    </div>
                ` : ''}

                ${displayFloors.map(floorNum => {
                    const groupQuestions = floorGroups[floorNum];
                    const floorTitle = groupQuestions[0].floorName || `第 ${floorNum} 層商品擂台`;

                    return `
                        <div class="floor-group-card" style="margin-bottom:20px;">
                            <div class="floor-group-header">
                                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                    <span class="nen-tag" style="background:var(--gold); color:#000; font-size:0.95rem; padding:4px 12px;">🗼 第 ${floorNum} 層 (${floorNum}F)</span>
                                    <strong style="font-size:1.15rem; color:#38bdf8;">📜 ${floorTitle}</strong>
                                    <span style="color:var(--text-muted); font-size:0.9rem;">（共 ${groupQuestions.length} 題）</span>
                                </div>
                                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                    <button class="btn-primary" style="padding:5px 12px; font-size:0.85rem;" onclick="AdminModule.moveFloorPrompt(${floorNum})">🔄 批次移動本層到...</button>
                                    <button class="btn-secondary" style="padding:5px 12px; font-size:0.85rem;" onclick="AdminModule.renameFloor(${floorNum}, '${floorTitle.replace(/'/g, "\\'")}')">✏️ 改名</button>
                                    <button class="btn-danger" style="padding:5px 12px; font-size:0.85rem;" onclick="AdminModule.deleteFloorQuestions(${floorNum})">🗑️ 刪除整層</button>
                                </div>
                            </div>

                            <div style="padding:12px 16px;">
                                ${groupQuestions.map((q, idx) => `
                                    <div style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:flex-start; gap:12px; background:${this.editingId === q.id ? 'rgba(245,158,11,0.15)' : 'transparent'}; border-radius:8px;">
                                        <div style="flex:1;">
                                            <div style="font-weight:800; font-size:1rem; color:#f8fafc;">
                                                <span style="color:var(--gold-light);">[${floorNum}F - Q${idx + 1}]</span> ${q.question}
                                            </div>
                                            <div style="font-size:0.9rem; color:#cbd5e1; margin-top:6px; line-height:1.5;">
                                                ${(q.options || []).map(opt => `<span style="display:inline-block; margin-right:14px;">${opt}</span>`).join('')}
                                            </div>
                                            <div style="font-size:0.85rem; color:var(--gold-light); margin-top:6px;">
                                                ✅ 正確答案：<strong>${q.answer}</strong> ｜ 💡 解析：${q.explanation || '無'}
                                            </div>
                                        </div>
                                        <div style="display:flex; gap:6px; flex-shrink:0;">
                                            <button class="btn-secondary" style="padding:6px 12px; font-size:0.85rem;" onclick="AdminModule.startEditQuestion('${q.id}')">✏️ 編輯</button>
                                            <button class="btn-danger" style="padding:6px 12px; font-size:0.85rem;" onclick="AdminModule.deleteQuestion('${q.id}')">刪除</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    login() {
        const pwd = document.getElementById('admin-pwd-input').value.trim();
        if (pwd === localStorage.getItem('ha_admin_pwd')) {
            this.isAuthenticated = true;
            this.render();
        } else {
            alert('後台密碼錯誤！');
        }
    },

    changeAdminPassword() {
        const newPwd = document.getElementById('new-admin-pwd').value.trim();
        if (!newPwd) {
            alert('請輸入新的後台密碼！');
            return;
        }
        localStorage.setItem('ha_admin_pwd', newPwd);
        document.getElementById('new-admin-pwd').value = '';
        alert('🔑 後台管理員密碼已更新！若要同步到雲端網站，請記得點擊左方「匯出最新 data.js」。');
    },

    setFloorFilter(val) {
        this.filterFloor = val;
        this.render();
    },

    // 📦 關鍵修正：匯出時強制將最新帳號清單與密碼同步進手機（同時保留業務既有闖關最高樓層）
    exportDataJsFile() {
        const currentUsers = DataStore.getUsers();
        const currentQuestions = DataStore.getQuestions();
        const currentAdminPwd = localStorage.getItem('ha_admin_pwd') || '8888';

        const fileContent = `// js/data.js - 自動封裝最新雲端題庫與挑戰者名單（支援手機一般模式強制同步）
const AVATAR_CONFIG = ${JSON.stringify(AVATAR_CONFIG, null, 4)};

const DEFAULT_FLOOR_MASTERS = ${JSON.stringify(DEFAULT_FLOOR_MASTERS, null, 4)};

const DEFAULT_QUESTIONS = ${JSON.stringify(currentQuestions, null, 4)};

const DEFAULT_USERS = ${JSON.stringify(currentUsers, null, 4)};

const DEFAULT_ADMIN_PWD = ${JSON.stringify(currentAdminPwd)};

const DataStore = {
    init() {
        const DATA_VERSION = '${Date.now()}';
        if (localStorage.getItem('ha_data_version') !== DATA_VERSION) {
            // 1. 強制更新最新題庫
            localStorage.setItem('ha_questions', JSON.stringify(DEFAULT_QUESTIONS));

            // 2. 智慧合併帳號名單：將新帳號與最新密碼強制寫入手機，同時保留該員在手機上已爬到的更高樓層與勝場
            const localUsers = JSON.parse(localStorage.getItem('ha_users') || '[]');
            const mergedUsers = DEFAULT_USERS.map(defUser => {
                const existing = localUsers.find(u => String(u.username).toLowerCase() === String(defUser.username).toLowerCase());
                if (existing) {
                    return {
                        ...defUser,
                        floor: Math.max(Number(defUser.floor) || 1, Number(existing.floor) || 1),
                        wins: Math.max(Number(defUser.wins) || 0, Number(existing.wins) || 0),
                        customAvatar: existing.customAvatar || defUser.customAvatar || ''
                    };
                }
                return defUser;
            });
            localStorage.setItem('ha_users', JSON.stringify(mergedUsers));

            // 3. 同步後台密碼與版本號
            localStorage.setItem('ha_admin_pwd', DEFAULT_ADMIN_PWD);
            localStorage.setItem('ha_data_version', DATA_VERSION);
        }
        if (!localStorage.getItem('ha_admin_pwd')) {
            localStorage.setItem('ha_admin_pwd', DEFAULT_ADMIN_PWD);
        }
    },
    getUsers() {
        const list = JSON.parse(localStorage.getItem('ha_users') || '[]');
        return list.length > 0 ? list : DEFAULT_USERS;
    },
    saveUsers(users) { localStorage.setItem('ha_users', JSON.stringify(users)); },
    getQuestions() {
        const list = JSON.parse(localStorage.getItem('ha_questions') || '[]');
        return list.length > 0 ? list : DEFAULT_QUESTIONS;
    },
    saveQuestions(questions) { localStorage.setItem('ha_questions', JSON.stringify(questions)); },
    getCurrentUser() {
        const username = localStorage.getItem('ha_current_user') || sessionStorage.getItem('ha_current_user');
        if (!username) return null;
        return this.getUsers().find(u => String(u.username).toLowerCase() === String(username).toLowerCase()) || null;
    },
    updateUser(updatedUser) {
        const users = this.getUsers().map(u => String(u.username).toLowerCase() === String(updatedUser.username).toLowerCase() ? updatedUser : u);
        this.saveUsers(users);
    },
    getAvatarInfo(user) {
        const base = AVATAR_CONFIG.find(a => a.id === user.roleId) || AVATAR_CONFIG[0];
        return {
            ...base,
            displayImg: (user.floor >= 30 && user.customAvatar) ? user.customAvatar : base.img
        };
    }
};

DataStore.init();
`;

        const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.js';
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ 已匯出最新 data.js！請將此檔案覆蓋至專案的 js/data.js 並 git push，手機一般模式打開就會自動載入所有最新帳號了！');
    },

    moveFloorPrompt(fromFloor) {
        const targetStr = prompt(`請輸入要將「第 ${fromFloor} 層」的所有題目移動到哪一個目標樓層數字（例如：3）：`);
        if (!targetStr) return;
        const targetFloor = parseInt(targetStr.trim(), 10);
        if (isNaN(targetFloor) || targetFloor < 1 || targetFloor > 200) {
            alert('⚠️ 請輸入有效的樓層數字（1 ~ 200）！');
            return;
        }

        const questions = DataStore.getQuestions();
        let count = 0;
        const updated = questions.map(q => {
            if (Number(q.floor) === Number(fromFloor)) {
                count++;
                return { ...q, floor: targetFloor };
            }
            return q;
        });

        DataStore.saveQuestions(updated);
        alert(`🎉 成功將 ${count} 道題目從 ${fromFloor}F 批次移動至 ${targetFloor}F！`);
        this.filterFloor = 'ALL';
        this.render();
    },

    startEditUser(username) {
        this.editingUser = username;
        this.render();
        const card = document.getElementById('user-form-card');
        if (card) card.scrollIntoView({ behavior: 'smooth' });
    },

    cancelEditUser() {
        this.editingUser = null;
        this.render();
    },

    saveUser() {
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value.trim();
        const nickname = document.getElementById('new-nickname').value.trim();
        const roleId = document.getElementById('new-role').value;
        const floor = parseInt(document.getElementById('new-floor').value, 10) || 1;
        const wins = parseInt(document.getElementById('new-wins').value, 10) || 0;

        if (!username || !password || !nickname) {
            alert('請完整填寫帳號、密碼與暱稱！');
            return;
        }

        const users = DataStore.getUsers();
        const existingIdx = users.findIndex(u => String(u.username).toLowerCase() === String(username).toLowerCase());

        if (existingIdx >= 0) {
            users[existingIdx] = {
                ...users[existingIdx],
                password,
                nickname,
                roleId,
                floor,
                wins
            };
        } else {
            users.push({ username, password, nickname, roleId, floor, customAvatar: '', wins });
        }

        DataStore.saveUsers(users);
        this.editingUser = null;
        alert(`✅ 挑戰者「${nickname}」資料已儲存成功！`);
        this.render();
    },

    deleteUser(username) {
        if (confirm(`確定要刪除挑戰者帳號「@${username}」嗎？`)) {
            const users = DataStore.getUsers().filter(u => u.username !== username);
            DataStore.saveUsers(users);
            if (this.editingUser === username) this.editingUser = null;
            this.render();
        }
    },

    startEditQuestion(id) {
        this.editingId = id;
        this.render();
        const formCard = document.getElementById('question-form-card');
        if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
    },

    cancelEdit() {
        this.editingId = null;
        this.render();
    },

    saveQuestionForm() {
        const floor = parseInt(document.getElementById('q-floor').value, 10) || 1;
        const floorName = document.getElementById('q-floor-name').value.trim() || `第 ${floor} 層商品修練`;
        const question = document.getElementById('q-text').value.trim();
        const optionsRaw = document.getElementById('q-options').value.trim().split('\n').map(s => s.trim()).filter(Boolean);
        const answer = document.getElementById('q-ans').value.trim().toUpperCase();
        const explanation = document.getElementById('q-exp').value.trim();

        if (!question || optionsRaw.length < 2 || !answer) {
            alert('請確認題目、選項與答案皆已完整填寫！');
            return;
        }

        const letters = ['A', 'B', 'C', 'D'];
        const formattedOptions = optionsRaw.slice(0, 4).map((opt, idx) => {
            const prefix = `${letters[idx]}.`;
            return opt.toUpperCase().startsWith(prefix) ? opt : `${prefix} ${opt}`;
        });

        let questions = DataStore.getQuestions();

        if (this.editingId) {
            questions = questions.map(q => {
                if (q.id === this.editingId) {
                    return { ...q, floor, floorName, question, options: formattedOptions, answer, explanation };
                }
                return q;
            });
            DataStore.saveQuestions(questions);
            this.editingId = null;
            alert('✅ 題目詳細內容已更新成功！');
        } else {
            questions.push({
                id: 'q_' + Date.now(),
                floor,
                floorName,
                question,
                options: formattedOptions,
                answer,
                explanation
            });
            DataStore.saveQuestions(questions);
            alert(`✅ 題目已新增至「${floor}F｜${floorName}」！`);
        }

        this.render();
    },

    renameFloor(floorNum, oldName) {
        const newName = prompt(`請輸入第 ${floorNum} 層的新樓層商品名稱：`, oldName);
        if (!newName || !newName.trim()) return;
        const questions = DataStore.getQuestions().map(q => {
            if (Number(q.floor) === Number(floorNum)) {
                return { ...q, floorName: newName.trim() };
            }
            return q;
        });
        DataStore.saveQuestions(questions);
        this.render();
    },

    deleteFloorQuestions(floorNum) {
        if (confirm(`確定要刪除「第 ${floorNum} 層」的所有題目嗎？`)) {
            const questions = DataStore.getQuestions().filter(q => Number(q.floor) !== Number(floorNum));
            DataStore.saveQuestions(questions);
            this.render();
        }
    },

    clearAllQuestions() {
        if (confirm('⚠️ 警告: 確定要「一鍵刪除目前所有樓層的全部題目」嗎？')) {
            DataStore.saveQuestions([]);
            this.editingId = null;
            this.filterFloor = 'ALL';
            alert('🗑️ 已清空所有題庫！');
            this.render();
        }
    },

    deleteQuestion(id) {
        if (confirm('確定要刪除這道題目嗎？')) {
            const questions = DataStore.getQuestions().filter(q => q.id !== id);
            DataStore.saveQuestions(questions);
            if (this.editingId === id) this.editingId = null;
            this.render();
        }
    },

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        const defaultFileName = file.name.replace(/\.[^/.]+$/, '');

        if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const imported = [];
            const header = rows[0] || [];
            const is8Cols = header.length === 8 || String(header[1] || '').includes('題目');

            rows.slice(1).forEach(r => {
                if (!r || r.length < 6) return;

                if (is8Cols) {
                    if (!r[1]) return;
                    const f = Number(r[0]) || 1;
                    imported.push({
                        id: 'q_' + Date.now() + Math.random(),
                        floor: f,
                        floorName: defaultFileName,
                        question: String(r[1]).trim(),
                        options: [
                            `A. ${r[2] ?? ''}`,
                            `B. ${r[3] ?? ''}`,
                            `C. ${r[4] ?? ''}`,
                            `D. ${r[5] ?? ''}`
                        ],
                        answer: String(r[6] || 'A').trim().toUpperCase(),
                        explanation: String(r[7] || '')
                    });
                } else {
                    if (!r[2]) return;
                    const f = Number(r[0]) || 1;
                    const fName = String(r[1] || defaultFileName).trim();
                    imported.push({
                        id: 'q_' + Date.now() + Math.random(),
                        floor: f,
                        floorName: fName,
                        question: String(r[2]).trim(),
                        options: [
                            `A. ${r[3] ?? ''}`,
                            `B. ${r[4] ?? ''}`,
                            `C. ${r[5] ?? ''}`,
                            `D. ${r[6] ?? ''}`
                        ],
                        answer: String(r[7] || 'A').trim().toUpperCase(),
                        explanation: String(r[8] || '')
                    });
                }
            });

            this.mergeImportedQuestions(imported);
        } else if (ext === 'txt') {
            const text = await file.text();
            this.parsePipeTextQuestions(text);
        } else if (ext === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(' ') + '\n';
            }
            this.parsePipeTextQuestions(fullText);
        }
        event.target.value = '';
    },

    parsePipeTextQuestions(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.includes('|'));
        const imported = lines.map(line => {
            const parts = line.split('|').map(p => p.trim());
            const f = Number(parts[0]) || 1;
            return {
                id: 'q_' + Date.now() + Math.random(),
                floor: f,
                floorName: parts[1] || `第 ${f} 層擂台`,
                question: parts[2] || '',
                options: [
                    `A. ${parts[3] || ''}`,
                    `B. ${parts[4] || ''}`,
                    `C. ${parts[5] || ''}`,
                    `D. ${parts[6] || ''}`
                ],
                answer: (parts[7] || 'A').toUpperCase(),
                explanation: parts[8] || ''
            };
        });
        this.mergeImportedQuestions(imported);
    },

    mergeImportedQuestions(imported) {
        if (!imported.length) {
            alert('⚠️ 未能解析出有效題目，請確認 Excel 欄位格式！');
            return;
        }
        const current = DataStore.getQuestions();
        DataStore.saveQuestions([...current, ...imported]);
        alert(`🎉 成功匯入 ${imported.length} 道商品訓練題目！`);
        this.render();
    }
};