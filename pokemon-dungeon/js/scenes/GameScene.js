class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    init(data) {
        this.floor = data.floor || 1;
        this.savedParty = data.savedParty || null;
    }

    // ─────────────────────────────────── CREATE ───────────────────────────────────

    create() {
        const TS = CFG.TILE;

        this.gen = new DungeonGen(CFG.MAP_W, CFG.MAP_H);
        this.dungeon = this.gen.generate(this.floor);

        this.revealed = Array.from({ length: CFG.MAP_H }, () => new Array(CFG.MAP_W).fill(false));
        this.visible  = Array.from({ length: CFG.MAP_H }, () => new Array(CFG.MAP_W).fill(false));

        this.occupied = new Map();

        this._buildTextures(TS);
        this._renderDungeon();

        this.fogGfx = this.add.graphics().setDepth(20);

        this._spawnParty();
        this._spawnEnemies();
        this._spawnItems();

        this.cameras.main.setBounds(0, 0, CFG.MAP_W * TS, CFG.MAP_H * TS);
        this.cameras.main.startFollow(this.party[0].sprite, true, 0.1, 0.1);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up:     Phaser.Input.Keyboard.KeyCodes.W,
            down:   Phaser.Input.Keyboard.KeyCodes.S,
            left:   Phaser.Input.Keyboard.KeyCodes.A,
            right:  Phaser.Input.Keyboard.KeyCodes.D,
            wait:   Phaser.Input.Keyboard.KeyCodes.SPACE,
            attack: Phaser.Input.Keyboard.KeyCodes.Z,
        });

        this.state = 'WAITING';
        this.moveTimer = 0;
        this.transitioning = false;

        this._updateVisibility();
        this._drawFog();

        if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
        this.time.delayedCall(80, () => { this._uiUpdate(); this._uiFloor(); });
    }

    // ─────────────────────────────────── UPDATE ───────────────────────────────────

    update(time) {
        if (this.state !== 'WAITING' || this.transitioning) return;
        if (time < this.moveTimer) return;

        const C = this.cursors, W = this.wasd;
        let dx = 0, dy = 0;

        if      (C.left.isDown  || W.left.isDown)  dx = -1;
        else if (C.right.isDown || W.right.isDown) dx =  1;
        else if (C.up.isDown    || W.up.isDown)    dy = -1;
        else if (C.down.isDown  || W.down.isDown)  dy =  1;
        else if (Phaser.Input.Keyboard.JustDown(W.wait)) {
            this.moveTimer = time + CFG.MOVE_DELAY;
            this._processTurn(null);
            return;
        } else if (Phaser.Input.Keyboard.JustDown(W.attack)) {
            this.moveTimer = time + CFG.MOVE_DELAY;
            this._doAttack();
            return;
        } else return;

        this.moveTimer = time + CFG.MOVE_DELAY;
        this._tryMoveLeader(dx, dy);
    }

    // ─────────────────────────────────── MOVEMENT ─────────────────────────────────

    _tryMoveLeader(dx, dy) {
        const leader = this.party[0];
        const nx = leader.gx + dx;
        const ny = leader.gy + dy;

        if (!this._inBounds(nx, ny)) return;

        const tile = this.dungeon.tiles[ny][nx];
        if (tile === CFG.T.WALL) {
            // Update facing even into walls so Z-attack direction is updated
            this._setFacing(leader, dx, dy);
            return;
        }

        // Ally at target → swap positions
        const allyIdx = this.party.findIndex((p, i) => i > 0 && p.alive && p.gx === nx && p.gy === ny);
        if (allyIdx > 0) {
            this._setFacing(leader, dx, dy);
            this._swapEntities(leader, this.party[allyIdx]);
            const newTile = this.dungeon.tiles[leader.gy][leader.gx];
            if (newTile === CFG.T.STAIRS) {
                this._log(`¡${leader.name} encontró las escaleras! Bajando al Piso ${this.floor + 1}...`);
                this.transitioning = true;
                this.time.delayedCall(600, () => this._nextFloor());
                return;
            }
            this._processTurn(null);
            return;
        }

        const occ = this.occupied.get(`${nx},${ny}`);

        // Enemy → bump-attack (classic PMD)
        if (occ && occ.isEnemy) {
            this._setFacing(leader, dx, dy);
            const prev = this._snap();
            this._combat(leader, occ);
            this._processTurn(prev);
            return;
        }

        // Normal move
        const prev = this._snap();
        this._setFacing(leader, dx, dy);
        this._move(leader, nx, ny);

        if (tile === CFG.T.STAIRS) {
            this._log(`¡${leader.name} encontró las escaleras! Bajando al Piso ${this.floor + 1}...`);
            this.transitioning = true;
            this.time.delayedCall(600, () => this._nextFloor());
            return;
        }

        this._processTurn(prev);
    }

    // Z key: attack in current facing direction without moving
    _doAttack() {
        const leader = this.party[0];
        const nx = leader.gx + leader.facingDx;
        const ny = leader.gy + leader.facingDy;

        const occ = this._inBounds(nx, ny) ? this.occupied.get(`${nx},${ny}`) : null;
        if (occ && occ.isEnemy) {
            this._combat(leader, occ);
        } else {
            this._log(`${leader.name} atacó al viento…`);
        }
        this._processTurn(null);
    }

    _processTurn(prevPositions) {
        this.state = 'PROCESSING';

        // Chain-follow: each follower steps into the previous member's old tile
        if (prevPositions) {
            for (let i = 1; i < this.party.length; i++) {
                const f = this.party[i];
                if (!f.alive) continue;
                const tgt = prevPositions[i - 1];
                if (!this.occupied.has(`${tgt.x},${tgt.y}`)) {
                    const fdx = Math.sign(tgt.x - f.gx);
                    const fdy = Math.sign(tgt.y - f.gy);
                    if (fdx !== 0 || fdy !== 0) this._setFacing(f, fdx, fdy);
                    this._move(f, tgt.x, tgt.y);
                }
            }
        }

        // Followers auto-attack adjacent enemies
        for (const m of this.party) {
            if (!m.alive) continue;
            const adj = this._adjEnemies(m);
            if (adj.length > 0) {
                const e = adj[0];
                this._setFacing(m, Math.sign(e.gx - m.gx), Math.sign(e.gy - m.gy));
                this._combat(m, e);
            }
        }

        // Item pickups
        for (const m of this.party) {
            if (!m.alive) continue;
            const item = this.items.find(it => it.alive && it.gx === m.gx && it.gy === m.gy);
            if (item) this._pickup(m, item);
        }

        this._updateVisibility();
        this._drawFog();
        this._processEnemies();
        this._uiUpdate();
        this.state = 'WAITING';
    }

    _processEnemies() {
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;

            const n = this._nearestParty(enemy);
            if (!n) continue;

            const dist = Math.abs(enemy.gx - n.gx) + Math.abs(enemy.gy - n.gy);

            if (dist === 1) {
                this._combat(enemy, n);
            } else if (dist <= 8) {
                const next = bfsStep(this.dungeon.tiles, { x: enemy.gx, y: enemy.gy },
                    { x: n.gx, y: n.gy }, CFG.MAP_W, CFG.MAP_H);
                if (next && !this.occupied.has(`${next.x},${next.y}`)) {
                    this._move(enemy, next.x, next.y);
                }
            } else if (Math.random() < 0.4) {
                const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
                const [ddx, ddy] = dirs[Math.floor(Math.random() * 4)];
                const nx = enemy.gx + ddx, ny = enemy.gy + ddy;
                if (this._walkable(nx, ny) && !this.occupied.has(`${nx},${ny}`)) {
                    this._move(enemy, nx, ny);
                }
            }
        }
    }

    // ─────────────────────────────────── COMBAT ───────────────────────────────────

    _combat(atk, def) {
        const dmg = Math.max(1, atk.atk - Math.floor(def.def / 2) + Phaser.Math.Between(-2, 3));
        def.hp = Math.max(0, def.hp - dmg);

        this._log(`${atk.name} → ${def.name}: ${dmg} dmg (HP ${def.hp}/${def.maxHp})`);
        this._showHit(def, dmg);
        this._updateHPBar(def);

        if (def.hp === 0) {
            this._log(`¡${def.name} se debilitó!`);
            this._removeEntity(def);
        }
    }

    _removeEntity(entity) {
        entity.alive = false;
        entity.sprite.setVisible(false);
        this.occupied.delete(`${entity.gx},${entity.gy}`);

        if (entity.isEnemy) {
            this.enemies = this.enemies.filter(e => e !== entity);
            return;
        }

        this.party = this.party.filter(p => p !== entity);
        if (this.party.length === 0) { this._gameOver(); return; }
        this.cameras.main.startFollow(this.party[0].sprite, true, 0.1, 0.1);
        this._log(`¡${this.party[0].name} toma el liderazgo!`);
    }

    // ─────────────────────────────────── ITEMS ────────────────────────────────────

    _pickup(member, item) {
        item.alive = false;
        item.sprite.setVisible(false);
        this.items = this.items.filter(i => i !== item);

        let heal = 0;
        if (item.itemType === 'berry') heal = Math.min(10, member.maxHp - member.hp);
        else heal = Math.min(Math.floor(member.maxHp * 0.3), member.maxHp - member.hp);
        member.hp += heal;

        this._log(`${member.name} recogió ${item.itemType === 'berry' ? 'Baya Oran' : 'Elixir'}. +${heal} HP (${member.hp}/${member.maxHp})`);
        this._updateHPBar(member);
    }

    // ─────────────────────────────────── FLOORS ───────────────────────────────────

    _nextFloor() {
        if (this.floor >= CFG.MAX_FLOORS) { this._victory(); return; }
        this.scene.restart({
            floor: this.floor + 1,
            savedParty: this.party.filter(p => p.alive).map(p => ({ key: p.key, hp: p.hp, maxHp: p.maxHp })),
        });
    }

    _gameOver() {
        this.transitioning = true;
        this.time.delayedCall(1200, () => { this.scene.stop('UIScene'); this.scene.start('GameOverScene'); });
    }

    _victory() {
        this.transitioning = true;
        this.time.delayedCall(800, () => { this.scene.stop('UIScene'); this.scene.start('VictoryScene'); });
    }

    // ─────────────────────────────────── VISIBILITY ───────────────────────────────

    _updateVisibility() {
        const { rooms } = this.dungeon;
        const H = CFG.MAP_H, W = CFG.MAP_W;
        const leader = this.party[0];

        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) this.visible[y][x] = false;

        const room = rooms.find(r =>
            leader.gx >= r.x && leader.gx < r.x + r.w &&
            leader.gy >= r.y && leader.gy < r.y + r.h
        );
        if (room) {
            for (let y = Math.max(0, room.y - 1); y < Math.min(H, room.y + room.h + 1); y++) {
                for (let x = Math.max(0, room.x - 1); x < Math.min(W, room.x + room.w + 1); x++) {
                    this.visible[y][x] = true;
                    this.revealed[y][x] = true;
                }
            }
        }

        const r = CFG.SIGHT_RADIUS;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                const tx = leader.gx + dx, ty = leader.gy + dy;
                if (this._inBounds(tx, ty)) {
                    this.visible[ty][tx] = true;
                    this.revealed[ty][tx] = true;
                }
            }
        }
    }

    _drawFog() {
        const TS = CFG.TILE, g = this.fogGfx;
        g.clear();
        for (let y = 0; y < CFG.MAP_H; y++) {
            for (let x = 0; x < CFG.MAP_W; x++) {
                if (!this.visible[y][x]) {
                    g.fillStyle(0x000000, this.revealed[y][x] ? 0.6 : 1.0);
                    g.fillRect(x * TS, y * TS, TS, TS);
                }
            }
        }
        for (const e of this.enemies) if (e.sprite) e.sprite.setVisible(e.alive && !!(this.visible[e.gy]?.[e.gx]));
        for (const it of this.items)   if (it.sprite) it.sprite.setVisible(it.alive && !!(this.visible[it.gy]?.[it.gx]));
    }

    // ─────────────────────────────────── SPAWN ────────────────────────────────────

    _spawnParty() {
        const { startX, startY } = this.dungeon;
        const entries = this.savedParty || [
            { key: 'bulbasaur', hp: null }, { key: 'charmander', hp: null }, { key: 'squirtle', hp: null },
        ];
        const placed = [];
        this.party = entries.map((saved, i) => {
            const key = saved.key, d = POKEMON[key];
            const pos = this._freeFloor(startX, startY, placed);
            placed.push(pos);
            const entity = this._makeEntity(pos.x, pos.y, key, d, false, i === 0);
            entity.hp = (saved.hp !== null && saved.hp !== undefined) ? saved.hp : d.hp;
            this._updateHPBar(entity);
            return entity;
        });
    }

    _spawnEnemies() {
        this.enemies = [];
        for (const e of this.dungeon.enemies) {
            if (this.occupied.has(`${e.x},${e.y}`)) continue;
            const d = POKEMON[e.key];
            this.enemies.push(this._makeEntity(e.x, e.y, e.key, d, true, false));
        }
    }

    _spawnItems() {
        this.items = [];
        for (const it of this.dungeon.items) {
            if (this.occupied.has(`${it.x},${it.y}`)) continue;
            const color = it.type === 'berry' ? 0x33bb44 : 0x33aaee;
            const label = it.type === 'berry' ? '♦' : '✦';
            const sprite = this.add.container(it.x * CFG.TILE + CFG.TILE / 2, it.y * CFG.TILE + CFG.TILE / 2).setDepth(3);
            sprite.add([
                this.add.rectangle(0, 0, CFG.TILE - 10, CFG.TILE - 10, color, 0.85),
                this.add.text(0, 0, label, { fontSize: '13px', color: '#fff' }).setOrigin(0.5),
            ]);
            const item = { gx: it.x, gy: it.y, alive: true, isItem: true, itemType: it.type, sprite };
            this.occupied.set(`${it.x},${it.y}`, item);
            this.items.push(item);
        }
    }

    // ─────────────────────────────────── ENTITY FACTORY ──────────────────────────

    _makeEntity(gx, gy, key, data, isEnemy, isLeader) {
        const TS = CFG.TILE;
        const sprite = this.add.container(gx * TS + TS / 2, gy * TS + TS / 2).setDepth(isEnemy ? 6 : 8);

        const r       = TS / 2 - 3;
        const outline = this.add.circle(0, 0, r + 2, isLeader ? 0xffd700 : (isEnemy ? 0xaa2222 : 0x226688));
        const body    = this.add.circle(0, 0, r, data.color);
        const letter  = this.add.text(0, 1, data.letter, { fontSize: '13px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        const barW = TS - 6;
        const hpBg = this.add.rectangle(0, -r - 5, barW, 4, 0x222222);
        const hpFg = this.add.rectangle(-barW / 2, -r - 5, barW, 4, 0x44ee44).setOrigin(0, 0.5);

        sprite.add([outline, body, letter, hpBg, hpFg]);

        // Facing direction dot (only for party members)
        let facingDot = null;
        if (!isEnemy) {
            facingDot = this.add.circle(0, r - 3, 3, 0xffffff, 0.9);
            sprite.add(facingDot);
        }

        const entity = {
            key, name: data.name, isEnemy,
            gx, gy, alive: true,
            hp: data.hp, maxHp: data.hp,
            atk: data.atk, def: data.def,
            sprite, hpFg, hpBarW: barW,
            facingDx: 0, facingDy: 1,  // default: facing down
            facingDot,
        };

        this.occupied.set(`${gx},${gy}`, entity);
        return entity;
    }

    // ─────────────────────────────────── FACING ───────────────────────────────────

    _setFacing(entity, dx, dy) {
        entity.facingDx = dx;
        entity.facingDy = dy;
        if (entity.facingDot) {
            const dist = CFG.TILE / 2 - 4;   // dot sits near edge of body
            entity.facingDot.setPosition(dx * dist, dy * dist);
        }
    }

    // Atomic swap of two entities' grid positions
    _swapEntities(a, b) {
        this.occupied.delete(`${a.gx},${a.gy}`);
        this.occupied.delete(`${b.gx},${b.gy}`);
        [a.gx, b.gx] = [b.gx, a.gx];
        [a.gy, b.gy] = [b.gy, a.gy];
        this.occupied.set(`${a.gx},${a.gy}`, a);
        this.occupied.set(`${b.gx},${b.gy}`, b);
        a.sprite.setPosition(a.gx * CFG.TILE + CFG.TILE / 2, a.gy * CFG.TILE + CFG.TILE / 2);
        b.sprite.setPosition(b.gx * CFG.TILE + CFG.TILE / 2, b.gy * CFG.TILE + CFG.TILE / 2);
    }

    // ─────────────────────────────────── VISUALS ──────────────────────────────────

    _updateHPBar(entity) {
        if (!entity.hpFg) return;
        const ratio = entity.hp / entity.maxHp;
        entity.hpFg.width = entity.hpBarW * ratio;
        entity.hpFg.fillColor = ratio > 0.5 ? 0x44ee44 : ratio > 0.25 ? 0xffcc00 : 0xff3333;
    }

    _showHit(entity, dmg) {
        if (!entity.sprite) return;
        const txt = this.add.text(
            entity.gx * CFG.TILE + CFG.TILE / 2,
            entity.gy * CFG.TILE - 4,
            `-${dmg}`,
            { fontSize: '13px', color: '#ff5555', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(30);

        this.tweens.add({ targets: txt, y: txt.y - 22, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
        this.tweens.add({
            targets: entity.sprite, alpha: 0.25, duration: 70, yoyo: true, repeat: 1,
            onComplete: () => entity.sprite?.setAlpha(1),
        });
    }

    // ─────────────────────────────────── DUNGEON RENDER ───────────────────────────

    _buildTextures(TS) {
        if (this.textures.exists('t_wall')) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(CFG.COLORS.WALL);
        g.fillRect(0, 0, TS, TS);
        g.fillStyle(CFG.COLORS.WALL_SHADE, 0.5);
        g.fillRect(2, 2, TS - 4, TS - 4);
        g.generateTexture('t_wall', TS, TS);

        g.clear();
        g.fillStyle(CFG.COLORS.FLOOR);
        g.fillRect(0, 0, TS, TS);
        g.fillStyle(CFG.COLORS.FLOOR_SHADE, 0.25);
        g.fillRect(1, 1, TS - 2, TS - 2);
        g.generateTexture('t_floor', TS, TS);

        g.clear();
        g.fillStyle(CFG.COLORS.CORRIDOR);
        g.fillRect(0, 0, TS, TS);
        g.generateTexture('t_corridor', TS, TS);

        g.clear();
        g.fillStyle(CFG.COLORS.FLOOR);
        g.fillRect(0, 0, TS, TS);
        g.fillStyle(CFG.COLORS.STAIRS_FG);
        const cx = TS / 2;
        [0, 1, 2, 3].forEach(i => { const sw = TS - 8 - i * 4; g.fillRect(cx - sw / 2, 4 + i * 6, sw, 4); });
        g.generateTexture('t_stairs', TS, TS);

        g.destroy();
    }

    _renderDungeon() {
        const TS = CFG.TILE;
        const km = { [CFG.T.WALL]: 't_wall', [CFG.T.FLOOR]: 't_floor', [CFG.T.CORRIDOR]: 't_corridor', [CFG.T.STAIRS]: 't_stairs' };
        for (let y = 0; y < CFG.MAP_H; y++) {
            for (let x = 0; x < CFG.MAP_W; x++) {
                this.add.image(x * TS, y * TS, km[this.dungeon.tiles[y][x]] || 't_wall').setOrigin(0, 0).setDepth(0);
            }
        }
    }

    // ─────────────────────────────────── HELPERS ──────────────────────────────────

    _inBounds(x, y) { return x >= 0 && y >= 0 && x < CFG.MAP_W && y < CFG.MAP_H; }
    _walkable(x, y) { return this._inBounds(x, y) && this.dungeon.tiles[y][x] !== CFG.T.WALL; }

    _move(entity, nx, ny) {
        this.occupied.delete(`${entity.gx},${entity.gy}`);
        entity.gx = nx; entity.gy = ny;
        this.occupied.set(`${nx},${ny}`, entity);
        entity.sprite.setPosition(nx * CFG.TILE + CFG.TILE / 2, ny * CFG.TILE + CFG.TILE / 2);
    }

    _snap() { return this.party.map(p => ({ x: p.gx, y: p.gy })); }

    _adjEnemies(m) {
        return [[1,0],[-1,0],[0,1],[0,-1]]
            .map(([dx, dy]) => this.occupied.get(`${m.gx + dx},${m.gy + dy}`))
            .filter(e => e && e.isEnemy && e.alive);
    }

    _nearestParty(enemy) {
        let n = null, best = Infinity;
        for (const m of this.party) {
            if (!m.alive) continue;
            const d = Math.abs(enemy.gx - m.gx) + Math.abs(enemy.gy - m.gy);
            if (d < best) { best = d; n = m; }
        }
        return n;
    }

    _freeFloor(cx, cy, exclude) {
        const offs = [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]];
        for (const [dx, dy] of offs) {
            const x = cx + dx, y = cy + dy, k = `${x},${y}`;
            if (this._walkable(x, y) && !this.occupied.has(k) && !exclude.some(p => p.x === x && p.y === y))
                return { x, y };
        }
        return { x: cx, y: cy };
    }

    // ─────────────────────────────────── UI BRIDGE ────────────────────────────────

    _uiUpdate() {
        const ui = this.scene.get('UIScene');
        if (!ui?.sys.isActive()) return;
        ui.updateParty(this.party);
        ui.updateFloor(this.floor);
        ui.updateMinimap(this.revealed, this.visible, this.dungeon.tiles, this.party, this.enemies);
    }

    _uiFloor() {
        const ui = this.scene.get('UIScene');
        if (!ui?.sys.isActive()) return;
        ui.updateFloor(this.floor);
    }

    _log(msg) {
        const ui = this.scene.get('UIScene');
        if (ui?.sys.isActive()) ui.addLog(msg);
    }
}
