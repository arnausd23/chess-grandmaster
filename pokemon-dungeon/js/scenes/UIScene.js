class UIScene extends Phaser.Scene {
    constructor() { super({ key: 'UIScene' }); }

    create() {
        const W = CFG.WIDTH, H = CFG.HEIGHT;
        this.cameras.main.setViewport(0, 0, W, H);

        // ── Left panel: party HP ──────────────────────────────────────────
        const panelW = 180, panelH = 130;
        this.add.rectangle(panelW / 2, panelH / 2 + 4, panelW, panelH, 0x000000, 0.72);
        this.add.rectangle(panelW / 2, panelH / 2 + 4, panelW, panelH, 0x224466, 0.1)
            .setStrokeStyle(1, 0x334466, 0.8);
        this.add.text(8, 8, 'EQUIPO', { fontSize: '11px', color: '#aabbcc', fontStyle: 'bold' });

        this.partyRows = [];
        for (let i = 0; i < 3; i++) {
            const y = 26 + i * 36;
            const dot   = this.add.circle(14, y + 9, 8, 0x445566);
            const lbl   = this.add.text(26, y, '—', { fontSize: '11px', color: '#ccddee', fontStyle: 'bold' });
            const hpTxt = this.add.text(26, y + 13, '', { fontSize: '10px', color: '#88aabb' });
            const barBg = this.add.rectangle(50, y + 17, 80, 5, 0x222222).setOrigin(0, 0.5);
            const barFg = this.add.rectangle(50, y + 17, 80, 5, 0x44ee44).setOrigin(0, 0.5);
            this.partyRows.push({ dot, lbl, hpTxt, barBg, barFg, barMaxW: 80 });
        }

        // ── Minimap (below party panel) ───────────────────────────────────
        this.mmTS = 3;
        this.mmX  = 6;
        this.mmY  = 152;
        const mmW = CFG.MAP_W * this.mmTS;
        const mmH = CFG.MAP_H * this.mmTS;

        // Outer background + label
        this.add.rectangle(this.mmX + mmW / 2, this.mmY - 9, mmW + 4, 14, 0x000000, 0.8);
        this.add.text(this.mmX + mmW / 2, this.mmY - 9, 'MAPA EXPLORADO', {
            fontSize: '9px', color: '#7788aa',
        }).setOrigin(0.5);

        this.add.rectangle(this.mmX + mmW / 2, this.mmY + mmH / 2, mmW + 2, mmH + 2, 0x000000, 0.8)
            .setStrokeStyle(1, 0x334466, 0.7);

        this.mmGfx = this.add.graphics();

        // ── Move panel (below minimap) ─────────────────────────────────────
        const slotH = 52;
        const mpStartY = 292;
        const mpH = 16 + 4 * slotH;
        this.add.rectangle(panelW / 2, mpStartY + mpH / 2, panelW, mpH, 0x000000, 0.72);
        this.add.rectangle(panelW / 2, mpStartY + mpH / 2, panelW, mpH, 0x224466, 0.1)
            .setStrokeStyle(1, 0x334466, 0.8);
        this.add.text(8, mpStartY + 2, 'ATAQUES  [1][2][3][4]', { fontSize: '10px', color: '#aabbcc', fontStyle: 'bold' });

        this.moveSlots = [];
        for (let i = 0; i < 4; i++) {
            const sy = mpStartY + 18 + i * slotH;
            const selBg = this.add.rectangle(panelW / 2, sy + slotH / 2 - 2, panelW - 4, slotH - 2, 0x1a3350, 0);
            this.add.text(8, sy + 6, `${i + 1}`, { fontSize: '11px', color: '#ffd700', fontStyle: 'bold' });
            const nameTxt = this.add.text(20, sy + 6, '—', { fontSize: '11px', color: '#ccddee' });
            const typeTxt = this.add.text(panelW - 4, sy + 6, '', { fontSize: '9px', color: '#aaaaaa' }).setOrigin(1, 0);
            const ppBg = this.add.rectangle(20, sy + 28, 110, 4, 0x333333).setOrigin(0, 0.5);
            const ppFg = this.add.rectangle(20, sy + 28, 110, 4, 0x4488ff).setOrigin(0, 0.5);
            const ppTxt = this.add.text(20, sy + 35, '', { fontSize: '9px', color: '#888899' });
            this.moveSlots.push({ selBg, nameTxt, typeTxt, ppBg, ppFg, ppTxt });
        }

        // ── Top-right: floor indicator ────────────────────────────────────
        this.add.rectangle(W - 80, 18, 130, 28, 0x000000, 0.72).setStrokeStyle(1, 0x334466, 0.8);
        this.floorText = this.add.text(W - 80, 18, 'PISO  1 / 10', {
            fontSize: '13px', color: '#ffd700', fontStyle: 'bold',
        }).setOrigin(0.5);

        // ── Bottom: message log ───────────────────────────────────────────
        const logH = 100, logW = W - 196;
        this.add.rectangle(logW / 2 + 194, H - logH / 2, logW, logH, 0x000000, 0.76);

        this.logLines = [];
        this.logTexts = [];
        for (let i = 0; i < 4; i++) {
            const t = this.add.text(198, H - logH + 8 + i * 22, '', {
                fontSize: '12px', color: '#ccddee',
                wordWrap: { width: logW - 16 },
            });
            t.setAlpha(1 - i * 0.2);
            this.logTexts.push(t);
        }

        // ── Controls hint (bottom-right) ──────────────────────────────────
        this.add.text(W - 8, H - logH - 4, '1/2/3/4 = Mov.  •  Z = Usar movimiento  •  SPACE = Esperar', {
            fontSize: '9px', color: '#445566',
        }).setOrigin(1, 1);
    }

    // ─────────────── PARTY ────────────────────────────────────────────────

    updateParty(party) {
        for (let i = 0; i < 3; i++) {
            const row = this.partyRows[i];
            const member = party[i];

            if (!member) {
                row.dot.setFillStyle(0x222222);
                row.lbl.setText('—').setColor('#444444');
                row.hpTxt.setText('');
                row.barFg.width = 0;
                continue;
            }

            const ratio    = member.hp / member.maxHp;
            const barColor = ratio > 0.5 ? 0x44ee44 : ratio > 0.25 ? 0xffcc00 : 0xff3333;
            const isLeader = i === 0;

            row.dot.setFillStyle(POKEMON[member.key]?.color || 0x666666);
            row.lbl.setText((isLeader ? '★ ' : '  ') + member.name).setColor(isLeader ? '#ffd700' : '#ccddee');
            row.hpTxt.setText(`HP ${member.hp} / ${member.maxHp}`);
            row.barFg.width    = row.barMaxW * ratio;
            row.barFg.fillColor = barColor;
        }
    }

    // ─────────────── FLOOR ────────────────────────────────────────────────

    updateFloor(floor) {
        this.floorText.setText(`PISO  ${floor} / ${CFG.MAX_FLOORS}`);
    }

    // ─────────────── MINIMAP ──────────────────────────────────────────────

    updateMinimap(revealed, visible, tiles, party, enemies) {
        if (!this.mmGfx || !revealed) return;

        const TS = this.mmTS, X = this.mmX, Y = this.mmY;
        const g  = this.mmGfx;
        g.clear();

        // Draw revealed tiles
        for (let y = 0; y < CFG.MAP_H; y++) {
            for (let x = 0; x < CFG.MAP_W; x++) {
                if (!revealed[y][x]) continue;
                const t   = tiles[y][x];
                const vis = visible[y][x];
                let col;
                if      (t === CFG.T.WALL)   col = vis ? 0x2d4466 : 0x1a2a44;
                else if (t === CFG.T.STAIRS)  col = 0xffd700;
                else                          col = vis ? 0x7a5a40 : 0x4a3220;
                g.fillStyle(col, 1);
                g.fillRect(X + x * TS, Y + y * TS, TS, TS);
            }
        }

        // Enemies — only when currently visible (no radar)
        for (const e of enemies) {
            if (!e.alive || !visible?.[e.gy]?.[e.gx]) continue;
            g.fillStyle(0xff4444, 1);
            g.fillRect(X + e.gx * TS, Y + e.gy * TS, TS, TS);
        }

        // Party: followers cyan, leader white (drawn on top)
        for (let i = party.length - 1; i >= 0; i--) {
            const m = party[i];
            if (!m.alive) continue;
            g.fillStyle(i === 0 ? 0xffffff : 0x44ddff, 1);
            g.fillRect(X + m.gx * TS, Y + m.gy * TS, TS, TS);
        }
    }

    // ─────────────── LOG ──────────────────────────────────────────────────

    // ─────────────── MOVES ────────────────────────────────────────────────

    updateMoves(party, selectedMove) {
        if (!party || party.length === 0 || !this.moveSlots) return;
        const leader = party[0];
        const TYPE_COL = {
            Normal: '#aaaaaa', Grass: '#66dd44', Fire: '#ff7744',
            Water: '#44aaff', Dark: '#9977bb',
        };
        for (let i = 0; i < this.moveSlots.length; i++) {
            const slot = this.moveSlots[i];
            const isSelected = i === selectedMove;
            const moveKey = leader.moveKeys?.[i];
            const moveDef = moveKey ? MOVES[moveKey] : null;
            const pp = leader.pp?.[i] ?? 0;

            if (isSelected) {
                slot.selBg.setFillStyle(0x1a3350, 0.85).setStrokeStyle(2, 0xffd700, 1);
            } else {
                slot.selBg.setFillStyle(0x000000, 0).setStrokeStyle(0);
            }

            if (!moveDef) {
                slot.nameTxt.setText('—').setColor('#445566');
                slot.typeTxt.setText('');
                slot.ppFg.width = 0;
                slot.ppTxt.setText('');
                continue;
            }

            const ppMax = moveDef.pp;
            const ppRatio = ppMax > 0 ? pp / ppMax : 0;
            const ppColor = ppRatio > 0.5 ? 0x44cc44 : ppRatio > 0.25 ? 0xffcc00 : 0xff4444;

            slot.nameTxt.setText(moveDef.name).setColor(isSelected ? '#ffd700' : '#ccddee');
            slot.typeTxt.setText(moveDef.type).setColor(TYPE_COL[moveDef.type] || '#aaaaaa');
            slot.ppFg.width = 110 * ppRatio;
            slot.ppFg.fillColor = ppColor;
            slot.ppTxt.setText(`PP ${pp}/${ppMax}`).setColor(pp <= 0 ? '#ff4444' : '#778899');
        }
    }

    addLog(msg) {
        this.logLines.unshift(msg);
        if (this.logLines.length > this.logTexts.length) this.logLines.pop();
        this.logTexts.forEach((t, i) => {
            t.setText(this.logLines[i] || '');
            t.setAlpha(Math.max(0.15, 1 - i * 0.22));
        });
    }
}

// ─────────────────────────────── GAME OVER / VICTORY ──────────────────────────

class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }
    create() {
        const W = CFG.WIDTH, H = CFG.HEIGHT;
        this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a0a);
        this.add.text(W / 2, H / 2 - 80, '💀', { fontSize: '64px' }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 - 10, 'TU EQUIPO FUE DERROTADO', {
            fontSize: '28px', color: '#ff4444', fontStyle: 'bold', stroke: '#220000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 40, 'La mazmorra resultó demasiado peligrosa...', {
            fontSize: '16px', color: '#aaaaaa',
        }).setOrigin(0.5);
        const btn = this.add.rectangle(W / 2, H / 2 + 100, 220, 44, 0x441111).setInteractive({ cursor: 'pointer' });
        const t   = this.add.text(W / 2, H / 2 + 100, 'VOLVER AL MENÚ', { fontSize: '15px', color: '#ffaaaa', fontStyle: 'bold' }).setOrigin(0.5);
        btn.on('pointerover',  () => { btn.setFillStyle(0x661111); t.setColor('#ffd700'); });
        btn.on('pointerout',   () => { btn.setFillStyle(0x441111); t.setColor('#ffaaaa'); });
        btn.on('pointerdown',  () => this.scene.start('MenuScene'));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'));
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() { super({ key: 'VictoryScene' }); }
    create() {
        const W = CFG.WIDTH, H = CFG.HEIGHT;
        this.add.rectangle(W / 2, H / 2, W, H, 0x0d1a0d);
        this.add.text(W / 2, H / 2 - 110, '🏆', { fontSize: '64px' }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 - 40, '¡FELICIDADES!', {
            fontSize: '36px', color: '#ffd700', fontStyle: 'bold', stroke: '#664400', strokeThickness: 5,
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 10, '¡Conquistaste la Torre del Tiempo!', { fontSize: '20px', color: '#aaffaa' }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 40, 'Tu equipo exploró los 10 pisos y regresó victorioso.', { fontSize: '14px', color: '#888888' }).setOrigin(0.5);
        const btn = this.add.rectangle(W / 2, H / 2 + 105, 220, 44, 0x1a4a1a).setInteractive({ cursor: 'pointer' });
        const t   = this.add.text(W / 2, H / 2 + 105, 'JUGAR DE NUEVO', { fontSize: '15px', color: '#aaffaa', fontStyle: 'bold' }).setOrigin(0.5);
        btn.on('pointerover',  () => { btn.setFillStyle(0x2a6a2a); t.setColor('#ffd700'); });
        btn.on('pointerout',   () => { btn.setFillStyle(0x1a4a1a); t.setColor('#aaffaa'); });
        btn.on('pointerdown',  () => this.scene.start('MenuScene'));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'));
        for (let i = 0; i < 30; i++) {
            const star = this.add.text(Math.random() * W, Math.random() * H, '★',
                { fontSize: `${10 + Math.random() * 20}px`, color: '#ffd700' });
            this.tweens.add({ targets: star, alpha: { from: 0, to: Math.random() * 0.8 + 0.2 },
                y: star.y - 40 - Math.random() * 60, duration: 1000 + Math.random() * 2000,
                delay: Math.random() * 1000, repeat: -1, yoyo: true });
        }
    }
}
