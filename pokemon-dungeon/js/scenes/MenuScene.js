class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        const W = CFG.WIDTH, H = CFG.HEIGHT;

        // Background gradient via rectangle layers
        this.add.rectangle(W / 2, H / 2, W, H, 0x0d1117);
        for (let i = 0; i < 5; i++) {
            this.add.rectangle(W / 2, H / 2, W, H - i * 80, 0x16213e, 0.15 * (5 - i));
        }

        // Stars decoration
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H * 0.6;
            const r = Math.random() < 0.8 ? 1 : 2;
            this.add.circle(x, y, r, 0xffffff, Math.random() * 0.6 + 0.2);
        }

        // Title
        this.add.text(W / 2, 72, 'POKÉMON', {
            fontSize: '52px', color: '#ffd700', fontStyle: 'bold',
            stroke: '#b8860b', strokeThickness: 5,
        }).setOrigin(0.5);
        this.add.text(W / 2, 130, 'MYSTERY DUNGEON', {
            fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
            stroke: '#555', strokeThickness: 3,
        }).setOrigin(0.5);
        this.add.text(W / 2, 168, '— Torre del Tiempo —', {
            fontSize: '16px', color: '#aaaaaa', fontStyle: 'italic',
        }).setOrigin(0.5);

        // Section: Party
        this.add.text(W / 2, 218, 'Tu equipo de exploración', {
            fontSize: '17px', color: '#e0e0e0',
        }).setOrigin(0.5);

        const starters = ['bulbasaur', 'charmander', 'squirtle'];
        const xs = [W / 2 - 220, W / 2, W / 2 + 220];

        starters.forEach((key, i) => {
            const d = POKEMON[key];
            const x = xs[i];
            const y = 310;

            // Card bg
            this.add.rectangle(x, y, 150, 140, 0x1a2744, 0.9);
            this.add.rectangle(x, y, 150, 140, i === 0 ? 0xffd700 : 0x444466, 0.4)
                .setStrokeStyle(2, i === 0 ? 0xffd700 : 0x446688);

            // Badge
            if (i === 0) {
                this.add.text(x, y - 56, '★ LÍDER', {
                    fontSize: '11px', color: '#ffd700', fontStyle: 'bold',
                }).setOrigin(0.5);
            } else {
                this.add.text(x, y - 56, `Aliado ${i}`, {
                    fontSize: '11px', color: '#8888aa',
                }).setOrigin(0.5);
            }

            // Circle sprite placeholder
            this.add.circle(x, y - 22, 32, d.color, 0.9);
            this.add.circle(x, y - 22, 26, d.color);
            this.add.text(x, y - 22, d.letter, {
                fontSize: '26px', color: '#fff', fontStyle: 'bold',
            }).setOrigin(0.5);

            this.add.text(x, y + 20, d.name, {
                fontSize: '13px', color: '#e0e0e0', fontStyle: 'bold',
            }).setOrigin(0.5);
            this.add.text(x, y + 36, `Tipo: ${d.type}`, {
                fontSize: '11px', color: '#aaaacc',
            }).setOrigin(0.5);
            this.add.text(x, y + 52, `HP ${d.hp}  ATK ${d.atk}  DEF ${d.def}`, {
                fontSize: '10px', color: '#888888',
            }).setOrigin(0.5);
        });

        // Controls info box
        this.add.rectangle(W / 2, 462, 600, 86, 0x111a2a, 0.9);
        const controls = [
            '↑↓←→ / WASD → Mover líder    •    SPACE → Esperar turno',
            'Camina hacia un enemigo para atacarlo',
            'Los aliados siguen automáticamente    •    ▼ escaleras = siguiente piso',
        ];
        controls.forEach((t, i) => {
            this.add.text(W / 2, 442 + i * 22, t, {
                fontSize: '12px', color: '#888899',
            }).setOrigin(0.5);
        });

        // Start button
        const btnBg = this.add.rectangle(W / 2, 540, 280, 48, 0x1e5628)
            .setInteractive({ cursor: 'pointer' });
        const btnText = this.add.text(W / 2, 540, '¡COMENZAR AVENTURA!', {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2a7a38); btnText.setColor('#ffd700'); });
        btnBg.on('pointerout',  () => { btnBg.setFillStyle(0x1e5628); btnText.setColor('#ffffff'); });
        btnBg.on('pointerdown', () => this._startGame());

        this.add.text(W / 2, 575, 'o presiona ENTER', {
            fontSize: '12px', color: '#555566',
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-ENTER', () => this._startGame());
        this.input.keyboard.on('keydown-SPACE', () => this._startGame());

        // Pulsing animation on button
        this.tweens.add({
            targets: btnBg,
            scaleX: 1.02, scaleY: 1.02,
            duration: 900, yoyo: true, repeat: -1,
        });
    }

    _startGame() {
        this.scene.start('GameScene', { floor: 1 });
        this.scene.stop('UIScene');
    }
}
