// js/leaderboard.js - 樓層英雄榜：頂部 TOP 3，中間鄰近樓層，最下方榮譽獎牌收藏櫃

const LeaderboardModule = {
    render() {
        const container = document.getElementById('view-leaderboard');
        const users = DataStore.getUsers();
        const allQuestions = DataStore.getQuestions();
        const currentUser = DataStore.getCurrentUser();

        // 1. 計算全體挑戰者前三名（依樓層高低排序，樓層相同者比勝場數）
        const rankedUsers = [...users].sort((a, b) => {
            const floorDiff = (Number(b.floor) || 1) - (Number(a.floor) || 1);
            if (floorDiff !== 0) return floorDiff;
            return (b.wins || 0) - (a.wins || 0);
        });
        const topThree = rankedUsers.slice(0, 3);

        // 2. 當前挑戰者附近樓層範圍計算 (前後各 2 層)
        const myFloor = currentUser ? (Number(currentUser.floor) || 1) : 1;
        const validFloors = [1];
        for (let f = 3; f <= 200; f += 3) {
            validFloors.push(f);
        }

        let myIndex = validFloors.indexOf(myFloor);
        if (myIndex === -1) {
            myIndex = 0;
            let minDiff = 999;
            validFloors.forEach((vf, idx) => {
                const diff = Math.abs(vf - myFloor);
                if (diff < minDiff) {
                    minDiff = diff;
                    myIndex = idx;
                }
            });
        }

        const startIndex = Math.max(0, myIndex - 2);
        const endIndex = Math.min(validFloors.length - 1, myIndex + 2);
        const allowedFloorsSet = new Set(validFloors.slice(startIndex, endIndex + 1));

        const floorGroups = {};
        users.forEach(u => {
            let f = Number(u.floor) || 1;
            if (f === 2) f = 3;
            if (allowedFloorsSet.has(f)) {
                if (!floorGroups[f]) floorGroups[f] = [];
                floorGroups[f].push(u);
            }
        });

        const sortedFloors = Object.keys(floorGroups)
            .map(Number)
            .sort((a, b) => b - a);

        // 3. 計算當前使用者的晉級次數與獎牌解鎖狀態 (每晉級 5 次解鎖一面新獎牌)
        const userWins = currentUser ? (currentUser.wins || 0) : 0;
        const medalMilestones = [
            { count: 5, name: '青銅・初階格鬥家', icon: '🥉', desc: '累積晉級 5 次' },
            { count: 10, name: '白銀・天空戰士', icon: '🥈', desc: '累積晉級 10 次' },
            { count: 15, name: '黃金・頂尖高手', icon: '🥇', desc: '累積晉級 15 次' },
            { count: 20, name: '白金・擂台霸主', icon: '💎', desc: '累積晉級 20 次' },
            { count: 25, name: '鑽石・傳奇巨星', icon: '✨', desc: '累積晉級 25 次' },
            { count: 30, name: '王者・天空之神', icon: '👑', desc: '累積晉級 30+ 次' }
        ];

        container.innerHTML = `
            <!-- 頂部：目前最高排行榜前三名名單 -->
            <div class="glass-card">
                <h2>🏆 天空競技場・最高排行榜 TOP 3 巔峰強者</h2>
                <p style="color:var(--text-muted); margin-bottom:14px;">全伺服器爬塔進度最快的頂尖挑戰者名單：</p>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
                    ${topThree.length === 0 ? `<p style="color:var(--text-muted);">目前尚無挑戰者紀錄。</p>` : ''}
                    ${topThree.map((u, idx) => {
                        const info = DataStore.getAvatarInfo(u);
                        const medals = ['🥇 冠軍', '🥈 亞軍', '🥉 季軍'];
                        const cardBorders = ['#f59e0b', '#94a3b8', '#d97706'];
                        return `
                            <div style="background:rgba(255,255,255,0.06); border:2px solid ${cardBorders[idx]}; border-radius:14px; padding:16px; text-align:center; position:relative; box-shadow:0 0 20px rgba(245,158,11,0.2);">
                                <div style="position:absolute; top:10px; right:12px; font-weight:900; color:${cardBorders[idx]}; font-size:1.1rem;">${medals[idx]}</div>
                                <img src="${info.displayImg}" style="width:72px;height:72px;border-radius:50%;background:#fff;object-fit:cover;border:3px solid ${cardBorders[idx]}; margin:8px auto;" onerror="this.src='assets/avatars/全能巨星.jpg'">
                                <div style="font-size:1.1rem; font-weight:900; color:#fff; margin-top:4px;">${u.nickname}</div>
                                <div style="font-size:0.9rem; color:var(--gold-light); margin-top:2px;">🗼 第 ${u.floor} 層 (${u.floor}F)</div>
                                <div style="margin-top:6px;">
                                    <span class="nen-tag ${info.nenClass}">${info.nen}</span>
                                    <span style="font-size:0.8rem; color:#38bdf8; margin-left:6px;">🏅 ${u.wins || 0} 勝</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 中間：鄰近樓層英雄榜（前後各 2 層） -->
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;">
                    <div>
                        <h2>🏆 鄰近樓層英雄榜</h2>
                        <p style="color:var(--text-muted); font-size:0.9rem; margin-top:4px;">
                            📍 目前您的位置：<strong>第 ${myFloor} 層</strong> ｜ 顯示範圍：以您為中心的前後各 2 個競技樓層
                        </p>
                    </div>
                </div>

                ${sortedFloors.length === 0 ? `
                    <div style="text-align:center; padding:35px; color:var(--text-muted); border:1px dashed rgba(255,255,255,0.2); border-radius:12px;">
                        目前的鄰近樓層範圍內尚無其他挑戰者。
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

            <!-- 最下方：每晉級 5 次的獨特榮譽獎牌收藏櫃 -->
            <div class="glass-card">
                <h2>🏅 您的榮譽晉級獎牌收藏櫃</h2>
                <p style="color:var(--text-muted); margin-bottom:16px;">
                    ${currentUser ? `目前您已累積達成 <strong>${userWins} 次</strong> 晉級勝場！` : '請先登入挑戰者帳號以查看您的專屬獎牌收藏。'}
                </p>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:14px;">
                    ${medalMilestones.map(m => {
                        const isUnlocked = userWins >= m.count;
                        return `
                            <div style="background:${isUnlocked ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 0, 0, 0.35)'}; border:2px solid ${isUnlocked ? 'var(--gold)' : 'rgba(255, 255, 255, 0.12)'}; border-radius:14px; padding:16px; text-align:center; opacity:${isUnlocked ? '1' : '0.5'}; position:relative; box-shadow:${isUnlocked ? '0 0 15px rgba(245,158,11,0.3)' : 'none'};">
                                <div style="font-size:2.8rem; margin-bottom:8px; filter:${isUnlocked ? 'drop-shadow(0 0 10px #f59e0b)' : 'grayscale(100%)'};">${m.icon}</div>
                                <div style="font-weight:900; font-size:0.95rem; color:${isUnlocked ? 'var(--gold-light)' : '#94a3b8'};">${m.name}</div>
                                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${m.desc}</div>
                                <div style="margin-top:8px; font-size:0.75rem; font-weight:800; color:${isUnlocked ? 'var(--success)' : '#ef4444'};">
                                    ${isUnlocked ? '✅ 已解鎖' : `🔒 尚差 ${m.count - userWins} 勝`}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
};