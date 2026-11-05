// js/arena.js - 30秒圓形倒數、1F直升3F、3F起每次+3層、自動尋題防卡關與念能力動畫引擎

const ArenaModule = {
    state: {
        questions: [],
        currentIndex: 0,
        answersLog: [],
        floorName: '',
        enemyName: '',
        enemyTitle: '',
        enemyAvatar: '',
        enemyHp: 100,
        playerHp: 100,
        isAnimating: false,
        timerInterval: null,
        timeLeft: 30
    },

    // 晉級邏輯：1F 直升 3F，其餘每次 +3 層 (3 -> 6 -> 9 -> 12 -> 15...)
    getNextFloor(currentFloor) {
        const f = Number(currentFloor) || 1;
        if (f < 3) return 3;
        return Math.min(200, f + 3);
    },

    // 關主命名對應：1F為第一層關主，3F為第三層關主，6F為第六層關主...
    getBossNameByFloor(floor) {
        const master = DEFAULT_FLOOR_MASTERS[floor];
        if (master && floor > 50) return master.name;

        const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        let cn = '';
        if (floor <= 10) {
            cn = digits[floor];
        } else if (floor < 20) {
            cn = '十' + digits[floor % 10];
        } else {
            const tens = Math.floor(floor / 10);
            const ones = floor % 10;
            cn = digits[tens] + '十' + (ones > 0 ? digits[ones] : '');
        }
        return `第${cn}層關主`;
    },

    clearTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    },

    startQuestionTimer() {
        this.clearTimer();
        const totalSeconds = 30;
        const circumference = 201;
        const startTime = performance.now();

        this.state.timerInterval = setInterval(() => {
            if (this.state.isAnimating) return;

            const elapsed = (performance.now() - startTime) / 1000;
            const remaining = Math.max(0, totalSeconds - elapsed);
            const secInt = Math.ceil(remaining);

            const textEl = document.getElementById('timer-sec-text');
            const circleEl = document.getElementById('timer-progress-circle');

            if (textEl) textEl.innerText = `${secInt}s`;
            if (circleEl) {
                const offset = circumference * (1 - remaining / totalSeconds);
                circleEl.style.strokeDashoffset = offset;

                if (remaining <= 10) circleEl.style.stroke = '#ef4444';
                else if (remaining <= 20) circleEl.style.stroke = '#f59e0b';
                else circleEl.style.stroke = '#10b981';
            }

            if (remaining <= 0) {
                this.clearTimer();
                this.submitAnswer('逾時未答');
            }
        }, 100);
    },

    startMatch() {
        this.clearTimer();
        const user = DataStore.getCurrentUser();
        if (!user) return;

        const allQuestions = DataStore.getQuestions();
        if (allQuestions.length === 0) {
            alert('目前題庫中沒有任何題目！請至「⚙️ 後台設定」匯入題庫。');
            return;
        }

        // 1. 先找當前樓層的題目
        let targetFloor = Number(user.floor) || 1;
        let pool = allQuestions.filter(q => Number(q.floor) === targetFloor);

        // 2. 防卡關機制：若當前樓層無題目，自動尋找下一個有題目的樓層
        if (pool.length === 0) {
            const availableFloors = [...new Set(allQuestions.map(q => Number(q.floor) || 1))].sort((a, b) => a - b);
            const nextAvailable = availableFloors.find(f => f >= targetFloor) || availableFloors[availableFloors.length - 1];
            
            if (nextAvailable) {
                targetFloor = nextAvailable;
                pool = allQuestions.filter(q => Number(q.floor) === targetFloor);
            }
        }

        if (pool.length === 0) {
            alert(`目前題庫中找不到任何有效題目，請至「⚙️ 後台設定」確認題庫內容。`);
            return;
        }

        const currentFloorName = pool[0].floorName || `第 ${targetFloor} 層商品擂台`;
        const shuffled = [...pool].sort(() => Math.random() - 0.5);

        const bossData = DEFAULT_FLOOR_MASTERS[targetFloor];
        const randomOpponent = AVATAR_CONFIG[targetFloor % AVATAR_CONFIG.length] || AVATAR_CONFIG[5];

        this.state = {
            questions: shuffled,
            currentIndex: 0,
            answersLog: [],
            floorName: currentFloorName,
            enemyName: this.getBossNameByFloor(targetFloor),
            enemyTitle: targetFloor >= 50 && bossData ? bossData.title : '樓層守門關主',
            enemyAvatar: bossData ? bossData.avatar : randomOpponent.img,
            enemyHp: 100,
            playerHp: 100,
            isAnimating: false,
            timerInterval: null,
            timeLeft: 30
        };

        App.switchTab('arena');
        this.renderBattle();
    },

    renderBattle() {
        const container = document.getElementById('view-arena');
        const user = DataStore.getCurrentUser();
        const avatarInfo = DataStore.getAvatarInfo(user);
        const q = this.state.questions[this.state.currentIndex];
        const displayFloorName = q.floorName || this.state.floorName;
        const totalQ = this.state.questions.length;
        const targetNextFloor = this.getNextFloor(user.floor);

        container.innerHTML = `
            <div class="arena-stage" id="arena-stage">
                <canvas id="nen-fx-canvas"></canvas>

                <div class="fighter-box" id="player-fighter">
                    <div class="fighter-avatar-wrap">
                        <img class="fighter-avatar" id="player-avatar-img" src="${avatarInfo.displayImg}" onerror="this.src='assets/avatars/全能巨星.jpg'">
                    </div>
                    <h4 style="margin-top:8px;">${user.nickname} (${user.floor}F)</h4>
                    <span class="nen-tag ${avatarInfo.nenClass}">${avatarInfo.nen}｜${avatarInfo.attackName}</span>
                    <div class="hp-bar-wrap">
                        <div class="hp-bar-fill" id="player-hp-bar" style="width: ${this.state.playerHp}%"></div>
                    </div>
                </div>

                <div class="arena-center-panel">
                    <div class="timer-ring-wrapper" title="每題作答限時 30 秒">
                        <svg class="timer-svg" viewBox="0 0 76 76">
                            <circle class="timer-circle-bg" cx="38" cy="38" r="32"></circle>
                            <circle class="timer-circle-progress" id="timer-progress-circle" cx="38" cy="38" r="32"></circle>
                        </svg>
                        <div class="timer-text" id="timer-sec-text">30s</div>
                    </div>
                    <div class="vs-title">VS</div>
                    <div class="center-product-banner">📜 ${displayFloorName}</div>
                </div>

                <div class="fighter-box" id="enemy-fighter">
                    <div class="fighter-avatar-wrap" id="enemy-avatar-wrap">
                        <img class="fighter-avatar" id="enemy-avatar-img" src="${this.state.enemyAvatar}" onerror="this.src='assets/avatars/獨行探員.jpg'">
                    </div>
                    <h4 style="margin-top:8px;">${this.state.enemyName}</h4>
                    <span class="nen-tag" style="background:#dc2626;color:#fff;">${this.state.enemyTitle}</span>
                    <div class="hp-bar-wrap">
                        <div class="hp-bar-fill" id="enemy-hp-bar" style="width: ${this.state.enemyHp}%; background:linear-gradient(90deg,#ef4444,#f97316);"></div>
                    </div>
                </div>
            </div>

            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; color:var(--gold-light); flex-wrap:wrap; gap:8px;">
                    <span style="font-size:1.1rem; font-weight:800;">
                        🔥 第 ${user.floor} 層擂台賽 ｜ <span style="color:#38bdf8;">${displayFloorName}</span>
                    </span>
                    <span>題目進度：${this.state.currentIndex + 1} / ${totalQ}（門檻 100% ⚡ 過關晉升至 ${targetNextFloor}F）</span>
                </div>
                <h3 style="margin-bottom:18px; line-height:1.6; font-size:1.25rem;">Q${this.state.currentIndex + 1}. ${q.question}</h3>
                <div>
                    ${q.options.map((opt, idx) => {
                        const letter = ['A', 'B', 'C', 'D'][idx];
                        return `<button class="option-btn" onclick="ArenaModule.submitAnswer('${letter}')">${opt}</button>`;
                    }).join('')}
                </div>
            </div>
        `;

        this.startQuestionTimer();
    },

    submitAnswer(selectedLetter) {
        if (this.state.isAnimating) return;
        this.clearTimer();
        this.state.isAnimating = true;

        const q = this.state.questions[this.state.currentIndex];
        const isCorrect = selectedLetter === q.answer.trim().toUpperCase();
        const damageStep = Math.ceil(100 / this.state.questions.length);

        this.state.answersLog.push({
            questionObj: q,
            selected: selectedLetter,
            isCorrect
        });

        const user = DataStore.getCurrentUser();
        const avatarInfo = DataStore.getAvatarInfo(user);
        const playerFighter = document.getElementById('player-fighter');
        const enemyFighter = document.getElementById('enemy-fighter');
        const stage = document.getElementById('arena-stage');

        if (isCorrect) {
            playerFighter.classList.add('attacker-charge');

            this.playNenCanvasAnimation(avatarInfo.nen, () => {
                this.state.enemyHp = Math.max(0, this.state.enemyHp - damageStep);
                const hpBar = document.getElementById('enemy-hp-bar');
                if (hpBar) hpBar.style.width = `${this.state.enemyHp}%`;

                enemyFighter.classList.add('boss-damaged');
                stage.classList.add('stage-shake');

                const wrap = document.getElementById('enemy-avatar-wrap');
                if (wrap) {
                    const dmgEl = document.createElement('div');
                    dmgEl.className = 'damage-popup';
                    dmgEl.innerText = `-${damageStep}`;
                    wrap.appendChild(dmgEl);
                }
            }, () => {
                this.state.isAnimating = false;
                this.nextStep();
            });
        } else {
            this.state.playerHp = Math.max(0, this.state.playerHp - damageStep);
            const hpBar = document.getElementById('player-hp-bar');
            if (hpBar) hpBar.style.width = `${this.state.playerHp}%`;
            playerFighter.classList.add('boss-damaged');
            stage.classList.add('stage-shake');

            setTimeout(() => {
                this.state.isAnimating = false;
                this.nextStep();
            }, 650);
        }
    },

    playNenCanvasAnimation(nenType, onImpactCallback, onCompleteCallback) {
        const canvas = document.getElementById('nen-fx-canvas');
        const stage = document.getElementById('arena-stage');
        const pImg = document.getElementById('player-avatar-img');
        const eImg = document.getElementById('enemy-avatar-img');
        if (!canvas || !stage || !pImg || !eImg) {
            onImpactCallback();
            onCompleteCallback();
            return;
        }

        const stageRect = stage.getBoundingClientRect();
        const pRect = pImg.getBoundingClientRect();
        const eRect = eImg.getBoundingClientRect();

        canvas.width = stageRect.width;
        canvas.height = stageRect.height;
        const ctx = canvas.getContext('2d');

        const startX = (pRect.left - stageRect.left) + pRect.width * 0.75;
        const startY = (pRect.top - stageRect.top) + pRect.height * 0.5;
        const endX = (eRect.left - stageRect.left) + eRect.width * 0.5;
        const endY = (eRect.top - stageRect.top) + eRect.height * 0.5;

        const totalDuration = 1150;
        const impactTime = 550;
        let impactTriggered = false;
        const startTime = performance.now();

        const particles = [];
        const createExplosion = (x, y, color1, color2) => {
            for (let i = 0; i < 55; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 14;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 3 + Math.random() * 8,
                    color: Math.random() > 0.4 ? color1 : color2,
                    alpha: 1
                });
            }
        };

        const renderFrame = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / totalDuration);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const flyProgress = Math.min(1, elapsed / impactTime);
            const easeFly = Math.pow(flyProgress, 1.8);
            const curX = startX + (endX - startX) * easeFly;
            const curY = startY + (endY - startY) * easeFly;

            if (elapsed >= impactTime && !impactTriggered) {
                impactTriggered = true;
                onImpactCallback();
                if (nenType === '強化系') createExplosion(endX, endY, '#f59e0b', '#ef4444');
                else if (nenType === '放出系') createExplosion(endX, endY, '#38bdf8', '#e0f2fe');
                else if (nenType === '具現化系') createExplosion(endX, endY, '#10b981', '#fde047');
                else if (nenType === '特質系') createExplosion(endX, endY, '#eab308', '#dc2626');
                else createExplosion(endX, endY, '#a855f7', '#38bdf8');
            }

            if (nenType === '強化系') {
                this.drawGonRockFist(ctx, startX, startY, curX, curY, flyProgress, progress, endX, endY);
            } else if (nenType === '放出系') {
                this.drawThunderbolt(ctx, startX, startY, curX, curY, flyProgress, progress, endX, endY);
            } else if (nenType === '具現化系') {
                this.drawConjurerChains(ctx, startX, startY, curX, curY, flyProgress, progress, endX, endY);
            } else if (nenType === '特質系') {
                this.drawDragonFist(ctx, startX, startY, curX, curY, flyProgress, progress, endX, endY);
            } else {
                this.drawThunderbolt(ctx, startX, startY, curX, curY, flyProgress, progress, endX, endY, '#c084fc', '#6366f1');
            }

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.94;
                p.vy *= 0.94;
                p.alpha -= 0.024;
                if (p.alpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 15;
                    ctx.fill();
                    ctx.restore();
                }
            });

            if (progress < 1) {
                requestAnimationFrame(renderFrame);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                onCompleteCallback();
            }
        };

        requestAnimationFrame(renderFrame);
    },

    drawGonRockFist(ctx, sx, sy, cx, cy, flyP, totalP, ex, ey) {
        ctx.save();
        if (totalP < 0.75) {
            const alpha = totalP < 0.5 ? 1 : 1 - (totalP - 0.5) * 4;
            ctx.globalAlpha = Math.max(0, alpha);

            const grad = ctx.createLinearGradient(sx, sy, cx, cy);
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
            grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.95)');
            grad.addColorStop(1, '#fef08a');

            ctx.beginPath();
            ctx.moveTo(sx, sy - 6);
            ctx.lineTo(cx, cy - 38 * flyP - 12);
            ctx.arc(cx, cy, 38 * flyP + 12, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(sx, sy + 6);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 35;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                const wx = sx + (cx - sx) * (i / 4);
                ctx.ellipse(wx, cy, 18 + i * 8, 42 + i * 10, 0.25, 0, Math.PI * 1.6);
                ctx.stroke();
            }

            ctx.translate(cx, cy);
            const fistScale = 0.8 + flyP * 0.7;
            ctx.scale(fistScale, fistScale);

            ctx.fillStyle = '#fef08a';
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(-24, -28, 48, 56, 14);
            ctx.fill();
            ctx.stroke();
            for (let k = -18; k <= 12; k += 10) {
                ctx.beginPath();
                ctx.roundRect(10, k, 18, 9, 4);
                ctx.fillStyle = '#f59e0b';
                ctx.fill();
                ctx.stroke();
            }
        }

        if (totalP >= 0.48) {
            const ringP = (totalP - 0.48) / 0.52;
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            ctx.arc(ex, ey, ringP * 130, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(254, 240, 138, ${1 - ringP})`;
            ctx.lineWidth = 12 * (1 - ringP);
            ctx.stroke();
        }
        ctx.restore();
    },

    drawThunderbolt(ctx, sx, sy, cx, cy, flyP, totalP, ex, ey, mainColor = '#38bdf8', subColor = '#e0f2fe') {
        ctx.save();
        if (totalP < 0.82) {
            for (let b = 0; b < 4; b++) {
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                const segments = 14;
                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    const px = sx + (cx - sx) * t;
                    const py = sy + (cy - sy) * t + (i === segments ? 0 : (Math.random() - 0.5) * 65);
                    ctx.lineTo(px, py);
                }
                ctx.strokeStyle = b === 0 ? '#ffffff' : mainColor;
                ctx.lineWidth = b === 0 ? 7 : 3;
                ctx.shadowColor = mainColor;
                ctx.shadowBlur = 28;
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(cx, cy, 22 + Math.random() * 12, 0, Math.PI * 2);
            ctx.fillStyle = subColor;
            ctx.shadowColor = mainColor;
            ctx.shadowBlur = 35;
            ctx.fill();
        }

        if (totalP >= 0.48) {
            for (let k = 0; k < 5; k++) {
                ctx.beginPath();
                ctx.moveTo(ex, ey - 90);
                ctx.lineTo(ex + (Math.random() - 0.5) * 60, ey - 30);
                ctx.lineTo(ex + (Math.random() - 0.5) * 60, ey + 30);
                ctx.lineTo(ex + (Math.random() - 0.5) * 70, ey + 85);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.shadowColor = mainColor;
                ctx.shadowBlur = 25;
                ctx.stroke();
            }
        }
        ctx.restore();
    },

    drawConjurerChains(ctx, sx, sy, cx, cy, flyP, totalP, ex, ey) {
        ctx.save();
        const offsets = [-22, 0, 22];
        offsets.forEach((offsetY, idx) => {
            const targetY = cy + offsetY * flyP;
            const dx = cx - sx;
            const dy = targetY - sy;
            const dist = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            const linkStep = 18;
            const count = Math.floor(dist / linkStep);

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);

            for (let i = 0; i < count; i++) {
                const lx = i * linkStep;
                ctx.beginPath();
                if (i % 2 === 0) {
                    ctx.ellipse(lx, 0, 10, 5, 0, 0, Math.PI * 2);
                } else {
                    ctx.ellipse(lx, 0, 9, 3, 0.3, 0, Math.PI * 2);
                }
                ctx.strokeStyle = idx === 1 ? '#fde047' : '#34d399';
                ctx.lineWidth = 3.5;
                ctx.shadowColor = '#10b981';
                ctx.shadowBlur = 12;
                ctx.stroke();
            }

            ctx.translate(dist, 0);
            ctx.beginPath();
            ctx.moveTo(26, 0);
            ctx.lineTo(-10, -12);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-10, 12);
            ctx.closePath();
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        if (totalP >= 0.48) {
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 5;
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 20;
            for (let r = -1; r <= 1; r += 2) {
                ctx.beginPath();
                ctx.ellipse(ex, ey, 58, 22, r * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    },

    drawDragonFist(ctx, sx, sy, cx, cy, flyP, totalP, ex, ey) {
        ctx.save();
        if (totalP < 0.85) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            const steps = 25;
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const px = sx + (cx - sx) * t;
                const wave = Math.sin(t * 10 - flyP * 12) * 28 * Math.sin(t * Math.PI);
                const py = sy + (cy - sy) * t + wave;
                ctx.lineTo(px, py);
            }
            const grad = ctx.createLinearGradient(sx, sy, cx, cy);
            grad.addColorStop(0, 'rgba(220, 38, 38, 0.2)');
            grad.addColorStop(0.5, '#f59e0b');
            grad.addColorStop(1, '#fef08a');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 28;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 35;
            ctx.stroke();

            ctx.translate(cx, cy);
            const s = 0.9 + flyP * 0.5;
            ctx.scale(s, s);

            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-35, -15);
            ctx.lineTo(-65, -42);
            ctx.lineTo(-20, -28);
            ctx.lineTo(35, -18);
            ctx.lineTo(15, -2);
            ctx.lineTo(35, 18);
            ctx.lineTo(-25, 22);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(-5, -10, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        ctx.restore();
    },

    nextStep() {
        this.state.currentIndex++;
        if (this.state.currentIndex < this.state.questions.length) {
            this.renderBattle();
        } else {
            this.renderResult();
        }
    },

    renderResult() {
        this.clearTimer();
        const container = document.getElementById('view-arena');
        const user = DataStore.getCurrentUser();
        const correctCount = this.state.answersLog.filter(a => a.isCorrect).length;
        const total = this.state.questions.length;
        const score = Math.round((correctCount / total) * 100);

        const passThreshold = 100;
        const passed = score === 100;
        const oldFloor = Number(user.floor) || 1;

        if (passed) {
            user.floor = this.getNextFloor(oldFloor);
            user.wins = (user.wins || 0) + 1;
            DataStore.updateUser(user);
        }

        const jumpDiff = user.floor - oldFloor;

        container.innerHTML = `
            <div class="glass-card ${passed ? 'promo-celebration-box' : ''}" style="text-align:center;">
                <canvas id="promo-fireworks-canvas" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1;"></canvas>
                <div style="position:relative; z-index:2;">
                    ${passed ? `
                        <div class="promo-badge-anim">🏆</div>
                        <div class="promo-title-glow">🎉 恭喜晉級！完美 100% 通關！</div>
                        <p style="font-size:1.3rem; color:var(--gold-light); font-weight:800; margin:12px 0;">
                            成功擊敗【${this.state.enemyName}】｜樓層躍升：${oldFloor}F ➔ ${user.floor}F <span style="color:#38bdf8;">(🔥 +${jumpDiff}層)</span>
                        </p>
                        ${oldFloor < 30 && user.floor >= 30 ? '<p style="color:var(--success); font-weight:800;">✨ 恭喜突破 30 樓層！已解鎖大廳「自訂專屬大頭像」特權！</p>' : ''}
                    ` : `
                        <h2>💥 【${this.state.floorName}】挑戰未過關！</h2>
                        <p style="font-size:1.2rem; margin:10px 0;">
                            本場得分：<strong style="color:var(--danger);">${score}%</strong> （過關門檻：需完成 <strong>${passThreshold}%</strong> 全對）
                        </p>
                    `}
                    <div style="margin-top:18px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                        <button class="btn-primary" onclick="ArenaModule.startMatch()">⚔️ ${passed ? `繼續挑戰第 ${user.floor} 層擂台` : `重新挑戰第 ${user.floor} 層`}</button>
                        <button class="btn-secondary" onclick="App.switchTab('lobby')">🏰 返回競技大廳</button>
                    </div>
                </div>
            </div>

            <div class="glass-card">
                <h3>📜 【${this.state.floorName}】完整題目與解析總覽</h3>
                <p style="color:var(--text-muted); margin-bottom:16px;">系統已自動將答錯或逾時題目標註「加強修練」，協助業務夥伴精準複習：</p>
                ${this.state.answersLog.map((log, i) => `
                    <div class="review-item ${log.isCorrect ? '' : 'wrong'}">
                        <div style="margin-bottom:8px;">
                            <strong>第 ${i + 1} 題：${log.questionObj.question}</strong>
                            ${log.isCorrect 
                                ? '<span style="color:var(--success); font-weight:800; margin-left:8px;">✅ 念擊命中</span>' 
                                : '<span class="badge-train">🔥 加強修練</span>'}
                        </div>
                        <ul style="list-style:none; margin:8px 0; font-size:0.95rem; line-height:1.6;">
                            ${log.questionObj.options.map(opt => `<li>${opt}</li>`).join('')}
                        </ul>
                        <p style="font-size:0.95rem;">
                            你的作答：<strong style="color:${log.isCorrect ? 'var(--success)' : 'var(--danger)'}">${log.selected}</strong> ｜ 
                            正確答案：<strong style="color:var(--gold-light)">${log.questionObj.answer}</strong>
                        </p>
                        <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.15); color:#cbd5e1;">
                            💡 <strong>專業解析：</strong>${log.questionObj.explanation || '無補充解析'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        if (passed) {
            this.playVictoryFireworks();
        }
    },

    playVictoryFireworks() {
        const canvas = document.getElementById('promo-fireworks-canvas');
        if (!canvas) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');

        const sparks = [];
        const colors = ['#fde047', '#f59e0b', '#38bdf8', '#10b981', '#f43f5e'];

        const spawnBurst = (x, y) => {
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 7;
                sparks.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    r: 2 + Math.random() * 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1
                });
            }
        };

        spawnBurst(canvas.width * 0.25, canvas.height * 0.4);
        setTimeout(() => spawnBurst(canvas.width * 0.75, canvas.height * 0.35), 300);
        setTimeout(() => spawnBurst(canvas.width * 0.5, canvas.height * 0.3), 650);

        let frames = 0;
        const animate = () => {
            frames++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            sparks.forEach(s => {
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.12;
                s.alpha -= 0.016;
                if (s.alpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, s.alpha);
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = s.color;
                    ctx.shadowColor = s.color;
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.restore();
                }
            });
            if (frames < 140) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        requestAnimationFrame(animate);
    }
};