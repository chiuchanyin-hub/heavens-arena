// js/leaderboard.js - 鄰近樓層英雄榜（自己的卡片顯示加粗金框與左上角皇冠）

const LeaderboardModule = {
    render() {
        const container = document.getElementById('view-leaderboard');
        const users = DataStore.getUsers();
        const allQuestions = DataStore.getQuestions();
        const currentUser = DataStore.getCurrentUser();

        const myFloor = currentUser ? (Number(currentUser.floor) || 1) : 1;
        const minFloor = Math.max(1, myFloor - 5);
        const maxFloor = Math.min(200, myFloor + 3);

        const floorGroups = {};
        users.forEach(u => {
            const f = Number(u.floor) || 1;
            if (f >= minFloor && f <= maxFloor) {
                if (!floorGroups[f]) floorGroups[f] = [];
                floorGroups[f].push(u);
            }
        });

        const sortedFloors = Object.keys(floorGroups)
            .map(Number)
            .sort((a, b) => b - a);

        container.innerHTML = `
            <!-- 50樓以上關主殿堂 -->
            <div class="glass-card">
                <h2>👑 天空競技場 50F+ 鎮守關主殿堂</h2>
                <p style="color:var(--text-muted); margin-bottom:14px;">登上 50 樓層以上的挑戰者，將正面對決以下傳奇關主：</p>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    ${Object.entries(DEFAULT_FLOOR_MASTERS).map(([floor, m]) => `
                        <div style="background:rgba(245,158,11,0.1); border:1px solid var(--gold); border-radius:12px; padding:12px; display:flex; align-items:center; gap:12px;">
                            <img src="${m.avatar}" style="width:56px;height:56px;border-radius:50%;background:#fff;object-fit:cover;" onerror="this.src='assets/avatars/全能巨星.jpg'">
                            <div>
                                <div style="color:var(--gold-light); font-weight:800;">${floor}F 關主</div>
                                <div style="font-weight:700;">${m.name}</div>
                                <small style="color:var(--text-muted);">${m.title}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 樓層英雄榜（以目前登入挑戰者為中心：下方 5 層 ~ 上方 3 層） -->
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;">
                    <div>
                        <h2>🏆 鄰近樓層英雄榜</h2>
                        <p style="color:var(--text-muted); font-size:0.9rem; margin-top:4px;">
                            📍 目前您的位置：<strong>第 ${myFloor} 層</strong> ｜ 顯示範圍：第 ${minFloor} 層 ～ 第 ${maxFloor} 層（下方 5 層 / 上方 3 層）
                        </p>
                    </div>
                </div>

                ${sortedFloors.length === 0 ? `
                    <div style="text-align:center; padding:35px; color:var(--text-muted); border:1px dashed rgba(255,255,255,0.2); border-radius:12px;">
                        目前在第 ${minFloor}F ~ ${maxFloor}F 範圍內尚無其他挑戰者。
                    </div>
                ` : ''}

                ${sortedFloors.map(floorNum => {
                    const groupUsers = floorGroups[floorNum].sort((a, b) => (b.wins || 0) - (a.wins || 0));
                    const floorQ = allQuestions.find(q => Number(q.floor) === floorNum);
                    const floorTitle = floorQ && floorQ.floorName ? floorQ.floorName : `第 ${floorNum} 層商品擂台`;
                    const isMyCurrentFloor = floorNum === myFloor;
                    const bossName = typeof ArenaModule !== 'undefined' ? ArenaModule.getBossNameByFloor(floorNum) : `第${floorNum}層關主`;

                    return `
                        <div class="floor-group-card" style="border-color:${isMyCurrentFloor ? 'var(--gold)' : 'rgba(245,158,11,0.4)'}; background:${isMyCurrentFloor ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)'};">
                            <div class="floor-group-header">
                                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                    <span class="nen-tag" style="background:${isMyCurrentFloor ? '#f59e0b' : 'var(--gold)'}; color:#000; font-size:0.95rem; padding:4px 12px;">
                                        🗼 第 ${floorNum} 層 (${floorNum}F) ${isMyCurrentFloor ? '⭐ [您的位置]' : ''}
                                    </span>
                                    <strong style="font-size:1.15rem; color:#38bdf8;">📜 ${floorTitle}</strong>
                                </div>
                                <div style="font-size:0.9rem; color:var(--text-muted);">
                                    守門關主：<strong style="color:#fca5a5;">${bossName}</strong>
                                </div>
                            </div>
                            <div class="floor-challenger-grid">
                                ${groupUsers.map(u => {
                                    const info = DataStore.getAvatarInfo(u);
                                    const isMe = currentUser && u.username === currentUser.username;
                                    return `
                                        <div class="floor-challenger-item ${isMe ? 'my-leaderboard-card' : ''}">
                                            ${isMe ? '<div class="my-crown-badge" title="您的位置">👑</div>' : ''}
                                            <img src="${info.displayImg}" style="width:48px;height:48px;border-radius:50%;background:#fff;object-fit:cover;border:2px solid var(--gold);flex-shrink:0;" onerror="this.src='assets/avatars/全能巨星.jpg'">
                                            <div>
                                                <div style="font-weight:800; font-size:1rem; color:${isMe ? 'var(--gold-light)' : '#f8fafc'};">
                                                    ${u.nickname} ${isMe ? '(您)' : ''}
                                                </div>
                                                <div style="margin-top:3px;">
                                                    <span class="nen-tag ${info.nenClass}">${info.nen}</span>
                                                    <span style="font-size:0.8rem; color:var(--gold-light); margin-left:6px;">🏅 ${u.wins || 0} 勝</span>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
};