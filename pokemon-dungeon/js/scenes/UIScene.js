class UIScene extends Phaser.Scene {
    constructor() { super({ key: 'UIScene' }); }

    create() {
        const W = CFG.WIDTH, H = CFG.HEIGHT;
        this.cameras.main.setViewport(0, 0, W, H);

        // ── Left panel: party HP ──────────────────────────────────────────
        const panelW = 180, panelH = 130;
        this.add.rectangle(panelW / 2, panelH / 2 + 4, panelW, panelH, 0x000000, 0.7);
        const border = this.add.rectangle(panelW / 2, panelH / 2 + 4, panelW, panelH, 0x224466, 0.1);
        border.setStrokeStyle(1, 0x334466, 0.8);

        this.add.text(8, 8, 'EQUIPO', { fontSize: '11px', color: '#aabbcc', fontStyle: 'bold' });

        this.partyRows = [];
        for (let i = 0; i < 3; i++) {
            const y = 26 + i * 36;
            const dot = this.add.circle(14, y + 9, 8, 0x445566);
            const lbl = this.add.text(26, y, '—', { fontSize: '11px', color: '#ccddee', fontStyle: 'bold' });
            const hpTxt = this.add.text(26, y + 13, '', { fontSize: '10px', color: '#88aabb' });
            const barBg = this.add.rectangle(50, y + 17, 80, 5, 0x222222).setOrigin(0, 0.5);
            const barFg = this.add.rectangle(50, y + 17, 80, 5, 0x44ee44).setOrigin(0, 0.5);
            this.partyRows.push({ dot, lbl, hpTxt, barBg, barFg, barMaxW: 80 });
        }

        // ── Top-right: floor indicator ────────────────────────────────────
        this.floorBg = this.add.rectangle(W - 80, 18, 130, 28, 0x000000, 0.7);
        this.floorBg.setStrokeStyle(1, 0x334466, 0.8);
        this.floorText = this.add.text(W - 80, 18, 'PISO  1 / 10', {
            fontSize: '13px', color: '#ffd700', fontStyle: 'bold',
        }).setOrigin(0.5);

        // ── Bottom: message log ───────────────────────────────────────────
        const logH = 100, logW = W - 200;
        this.add.rectangle(logW / 2 + 190, H - logH / 2, logW, logH, 0x000000, 0.75);

        this.logLines = [];
        this.logTexts = [];
        const numLines = 4;
        for (let i = 0; i < numLines; i++) {
            const t = this.add.text(200, H - logH + 8 + i * 22, '', {
                fontSize: '12px', color: '#ccddee',
                wordWrap: { width: logW - 20 },
            });
            t.setAlpha(1 - i * 0.2);
            this.logTexts.push(t);
        }

        // ── Mini-map ──────────────────────────────────────────────────────
        this.minimapBg = this.add.rectangle(W - 30, H - 30, 40, 40, 0x000000, 0);
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

            const ratio = member.hp / member.maxHp;
            const barColor = ratio > 0.5 ? 0x44ee44 : ratio > 0.25 ? 0xffcc00 : 0xff3333;
            const isLeader = i === 0;

            row.dot.setFillStyle(POKEMON[member.key]?.color || 0x666666);
            row.lbl.setText((isLeader ? '★ ' : '  ') + member.name)
                .setColor(isLeader ? '#ffd700' : '#ccddee');
            row.hpTxt.setText(`HP ${member.hp} / ${member.maxHp}`);
            row.barFg.width = row.barMaxW * ratio;
            row.barFg.fillColor = barColor;
        }
    }

    // ─────────────── FLOOR ────────────────────────────────────────────────

    updateFloor(floor) {
        this.floorText.setText(`PISO  ${floor} / ${CFG.MAX_FLOORS}`);
    }

    // ─────────────── LOG ──────────────────────────────────────────────────

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
            fontSize: '28px', color: '#ff4444', fontStyle: 'bold',
            stroke: '#220000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 40, 'La mazmorra resultó demasiado peligrosa...', {
            fontSize: '16px', color: '#aaaaaa',
        }).setOrigin(0.5);

        const btn = this.add.rectangle(W / 2, H / 2 + 100, 220, 44, 0x441111)
            .setInteractive({ cursor: 'pointer' });
        const t = this.add.text(W / 2, H / 2 + 100, 'VOLVER AL MENÚ', {
            fontSize: '15px', color: '#ffaaaa', fontStyle: 'bold',
        }).setOrigin(0.5);

        btn.on('pointerover', () => { btn.setFillStyle(0x661111); t.setColor('#ffd700'); });
        btn.on('pointerout',  () => { btn.setFillStyle(0x441111); t.setColor('#ffaaaa'); });
        btn.on('pointerdown', () => this.scene.start('MenuScene'));
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
            fontSize: '36px', color: '#ffd700', fontStyle: 'bold',
            stroke: '#664400', strokeThickness: 5,
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 10, '¡Conquistaste la Torre del Tiempo!', {
            fontSize: '20px', color: '#aaffaa',
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 40, 'Tu equipo exploró los 10 pisos y regresó victorioso.', {
            fontSize: '14px', color: '#888888',
        }).setOrigin(0.5);

        const btn = this.add.rectangle(W / 2, H / 2 + 105, 220, 44, 0x1a4a1a)
            .setInteractive({ cursor: 'pointer' });
        const t = this.add.text(W / 2, H / 2 + 105, 'JUGAR DE NUEVO', {
            fontSize: '15px', color: '#aaffaa', fontStyle: 'bold',
        }).setOrigin(0.5);

        btn.on('pointerover', () => { btn.setFillStyle(0x2a6a2a); t.setColor('#ffd700'); });
        btn.on('pointerout',  () => { btn.setFillStyle(0x1a4a1a); t.setColor('#aaffaa'); });
        btn.on('pointerdown', () => this.scene.start('MenuScene'));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'));

        // Particle-like celebration
        for (let i = 0; i < 30; i++) {
            const star = this.add.text(
                Math.random() * W,
                Math.random() * H,
                '★',
                { fontSize: `${10 + Math.random() * 20}px`, color: '#ffd700', alpha: 0 }
            );
            this.tweens.add({
                targets: star,
                alpha: { from: 0, to: Math.random() * 0.8 + 0.2 },
                y: star.y - 40 - Math.random() * 60,
                duration: 1000 + Math.random() * 2000,
                delay: Math.random() * 1000,
                repeat: -1,
                yoyo: true,
            });
        }
    }
}
