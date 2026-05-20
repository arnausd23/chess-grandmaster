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

        // "gx,gy" -> entity (fast collision/lookup)
        this.occupied = new Map();

        this._buildTextures(TS);
        this._renderDungeon();

        this.fogGfx = this.add.graphics().setDepth(20);

        // Spawn order matters: party first so items/enemies avoid their tiles
        this._spawnParty();
        this._spawnEnemies();
        this._spawnItems();

        this.cameras.main.setBounds(0, 0, CFG.MAP_W * TS, CFG.MAP_H * TS);
        this.cameras.main.startFollow(this.party[0].sprite, true, 0.1, 0.1);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up:   Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right:Phaser.Input.Keyboard.KeyCodes.D,
            wait: Phaser.Input.Keyboard.KeyCodes.SPACE,
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
        if (tile === CFG.T.WALL) return;

        // Follower blocking?
        for (let i = 1; i < this.party.length; i++) {
            if (this.party[i].gx === nx && this.party[i].gy === ny) return;
        }

        const occ = this.occupied.get(`${nx},${ny}`);

        // Enemy → attack instead of move
        if (occ && occ.isEnemy) {
            const prev = this._snapshotPositions();
            this._combat(leader, occ);
            this._processTurn(prev);
            return;
        }

        // Walk into item → move (pickup happens in _processTurn)
        const prev = this._snapshotPositions();
        this._moveEntity(leader, nx, ny);

        // Stairs?
        if (tile === CFG.T.STAIRS) {
            this._log(`¡${leader.name} encontró las escaleras! Bajando al Piso ${this.floor + 1}...`);
            this.transitioning = true;
            this.time.delayedCall(600, () => this._nextFloor());
            return;
        }

        this._processTurn(prev);
    }

    _processTurn(prevPositions) {
        this.state = 'PROCESSING';

        // Chain: each follower steps into the previous member's old tile
        if (prevPositions) {
            for (let i = 1; i < this.party.length; i++) {
                const follower = this.party[i];
                if (!follower.alive) continue;
                const tgt = prevPositions[i - 1];
                if (!this.occupied.has(`${tgt.x},${tgt.y}`)) {
                    this._moveEntity(follower, tgt.x, tgt.y);
                }
            }
        }

        // Followers auto-attack adjacent enemies
        for (const member of this.party) {
            if (!member.alive) continue;
            const adj = this._adjacentEnemies(member);
            if (adj.length > 0) this._combat(member, adj[0]);
        }

        // Item pickups for every party member
        for (const member of this.party) {
            if (!member.alive) continue;
            const item = this.items.find(it => it.alive && it.gx === member.gx && it.gy === member.gy);
            if (item) this._pickupItem(member, item);
        }

        // Update fog
        this._updateVisibility();
        this._drawFog();

        // Enemy AI
        this._processEnemies();

        this._uiUpdate();
        this.state = 'WAITING';
    }

    _processEnemies() {
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;

            const nearest = this._nearestPartyMember(enemy);
            if (!nearest) continue;

            const dist = Math.abs(enemy.gx - nearest.gx) + Math.abs(enemy.gy - nearest.gy);

            if (dist === 1) {
                this._combat(enemy, nearest);
            } else if (dist <= 8) {
                const next = bfsStep(
                    this.dungeon.tiles,
                    { x: enemy.gx, y: enemy.gy },
                    { x: nearest.gx, y: nearest.gy },
                    CFG.MAP_W, CFG.MAP_H
                );
                if (next && !this.occupied.has(`${next.x},${next.y}`)) {
                    this._moveEntity(enemy, next.x, next.y);
                }
            } else if (Math.random() < 0.4) {
                const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
                const [ddx, ddy] = dirs[Math.floor(Math.random() * 4)];
                const nx = enemy.gx + ddx, ny = enemy.gy + ddy;
                if (this._isWalkable(nx, ny) && !this.occupied.has(`${nx},${ny}`)) {
                    this._moveEntity(enemy, nx, ny);
                }
            }
        }
    }

    // ─────────────────────────────────── COMBAT ───────────────────────────────────

    _combat(attacker, defender) {
        const raw = attacker.atk - Math.floor(defender.def / 2);
        const dmg = Math.max(1, raw + Phaser.Math.Between(-2, 3));
        defender.hp = Math.max(0, defender.hp - dmg);

        this._log(`${attacker.name} → ${defender.name}: ${dmg} dmg (HP ${defender.hp}/${defender.maxHp})`);
        this._showHit(defender, dmg);
        this._updateHPBar(defender);

        if (defender.hp === 0) {
            this._log(`¡${defender.name} se debilitó!`);
            this._removeEntity(defender);
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

        if (this.party.length === 0) {
            this._gameOver();
            return;
        }
        this.cameras.main.startFollow(this.party[0].sprite, true, 0.1, 0.1);
        this._log(`¡${this.party[0].name} toma el liderazgo!`);
    }

    // ─────────────────────────────────── ITEMS ────────────────────────────────────

    _pickupItem(member, item) {
        item.alive = false;
        item.sprite.setVisible(false);
        // Don't delete from occupied — _moveEntity already replaced the item entry with the member
        this.items = this.items.filter(i => i !== item);

        if (item.itemType === 'berry') {
            const heal = Math.min(10, member.maxHp - member.hp);
            member.hp += heal;
            this._log(`${member.name} recogió Baya Oran. +${heal} HP (${member.hp}/${member.maxHp})`);
        } else {
            const heal = Math.min(Math.floor(member.maxHp * 0.3), member.maxHp - member.hp);
            member.hp += heal;
            this._log(`${member.name} recogió un Elixir. +${heal} HP (${member.hp}/${member.maxHp})`);
        }
        this._updateHPBar(member);
    }

    // ─────────────────────────────────── FLOORS ───────────────────────────────────

    _nextFloor() {
        if (this.floor >= CFG.MAX_FLOORS) {
            this._victory();
            return;
        }
        this.scene.restart({ floor: this.floor + 1, savedParty: this._serializeParty() });
    }

    _serializeParty() {
        return this.party.filter(p => p.alive).map(p => ({ key: p.key, hp: p.hp, maxHp: p.maxHp }));
    }

    _gameOver() {
        this.transitioning = true;
        this._log('¡Tu equipo fue derrotado...');
        this.time.delayedCall(1200, () => {
            this.scene.stop('UIScene');
            this.scene.start('GameOverScene');
        });
    }

    _victory() {
        this.transitioning = true;
        this.time.delayedCall(800, () => {
            this.scene.stop('UIScene');
            this.scene.start('VictoryScene');
        });
    }

    // ─────────────────────────────────── VISIBILITY ───────────────────────────────

    _updateVisibility() {
        const { rooms } = this.dungeon;
        const H = CFG.MAP_H, W = CFG.MAP_W;
        const leader = this.party[0];

        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++)
                this.visible[y][x] = false;

        // Reveal the room the leader is currently in
        const leaderRoom = rooms.find(r =>
            leader.gx >= r.x && leader.gx < r.x + r.w &&
            leader.gy >= r.y && leader.gy < r.y + r.h
        );
        if (leaderRoom) {
            for (let y = Math.max(0, leaderRoom.y - 1); y < Math.min(H, leaderRoom.y + leaderRoom.h + 1); y++) {
                for (let x = Math.max(0, leaderRoom.x - 1); x < Math.min(W, leaderRoom.x + leaderRoom.w + 1); x++) {
                    this.visible[y][x] = true;
                    this.revealed[y][x] = true;
                }
            }
        }

        // Corridor sight radius
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
        const TS = CFG.TILE;
        const g = this.fogGfx;
        g.clear();

        for (let y = 0; y < CFG.MAP_H; y++) {
            for (let x = 0; x < CFG.MAP_W; x++) {
                if (!this.visible[y][x]) {
                    g.fillStyle(0x000000, this.revealed[y][x] ? 0.6 : 1.0);
                    g.fillRect(x * TS, y * TS, TS, TS);
                }
            }
        }

        for (const e of this.enemies) {
            if (e.sprite) e.sprite.setVisible(e.alive && !!(this.visible[e.gy]?.[e.gx]));
        }
        for (const it of this.items) {
            if (it.sprite) it.sprite.setVisible(it.alive && !!(this.visible[it.gy]?.[it.gx]));
        }
    }

    // ─────────────────────────────────── SPAWN ────────────────────────────────────

    _spawnParty() {
        const { startX, startY } = this.dungeon;

        const entries = this.savedParty || [
            { key: 'bulbasaur',  hp: null },
            { key: 'charmander', hp: null },
            { key: 'squirtle',   hp: null },
        ];

        const placed = [];
        this.party = entries.map((saved, i) => {
            const key = saved.key;
            const d = POKEMON[key];
            const pos = this._findFreeFloor(startX, startY, placed);
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
            // Skip if tile already taken (prevents stacking)
            if (this.occupied.has(`${e.x},${e.y}`)) continue;
            const d = POKEMON[e.key];
            const entity = this._makeEntity(e.x, e.y, e.key, d, true, false);
            this.enemies.push(entity);
        }
    }

    _spawnItems() {
        this.items = [];
        for (const it of this.dungeon.items) {
            // Skip if already occupied
            if (this.occupied.has(`${it.x},${it.y}`)) continue;

            const color = it.type === 'berry' ? 0x33bb44 : 0x33aaee;
            const label = it.type === 'berry' ? '♦' : '✦';

            const sprite = this.add.container(
                it.x * CFG.TILE + CFG.TILE / 2,
                it.y * CFG.TILE + CFG.TILE / 2
            ).setDepth(3);

            const bg  = this.add.rectangle(0, 0, CFG.TILE - 10, CFG.TILE - 10, color, 0.85);
            const txt = this.add.text(0, 0, label, { fontSize: '13px', color: '#fff' }).setOrigin(0.5);
            sprite.add([bg, txt]);

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
        const letter  = this.add.text(0, 1, data.letter, {
            fontSize: '13px', color: '#fff', fontStyle: 'bold',
        }).setOrigin(0.5);

        const barW  = TS - 6;
        const hpBg  = this.add.rectangle(0, -r - 5, barW, 4, 0x222222);
        const hpFg  = this.add.rectangle(-barW / 2, -r - 5, barW, 4, 0x44ee44).setOrigin(0, 0.5);

        sprite.add([outline, body, letter, hpBg, hpFg]);

        const entity = {
            key, name: data.name, isEnemy,
            gx, gy, alive: true,
            hp: data.hp, maxHp: data.hp,
            atk: data.atk, def: data.def,
            sprite, hpFg, hpBarW: barW,
        };

        this.occupied.set(`${gx},${gy}`, entity);
        return entity;
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

        this.tweens.add({
            targets: txt,
            y: txt.y - 22, alpha: 0, duration: 700,
            onComplete: () => txt.destroy(),
        });
        this.tweens.add({
            targets: entity.sprite,
            alpha: 0.25, duration: 70, yoyo: true, repeat: 1,
            onComplete: () => entity.sprite && entity.sprite.setAlpha(1),
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
        [0, 1, 2, 3].forEach(i => {
            const sw = TS - 8 - i * 4;
            g.fillRect(cx - sw / 2, 4 + i * 6, sw, 4);
        });
        g.generateTexture('t_stairs', TS, TS);

        g.destroy();
    }

    _renderDungeon() {
        const TS = CFG.TILE;
        const keyMap = {
            [CFG.T.WALL]:    't_wall',
            [CFG.T.FLOOR]:   't_floor',
            [CFG.T.CORRIDOR]:'t_corridor',
            [CFG.T.STAIRS]:  't_stairs',
        };
        for (let y = 0; y < CFG.MAP_H; y++) {
            for (let x = 0; x < CFG.MAP_W; x++) {
                this.add.image(x * TS, y * TS, keyMap[this.dungeon.tiles[y][x]] || 't_wall')
                    .setOrigin(0, 0).setDepth(0);
            }
        }
    }

    // ─────────────────────────────────── HELPERS ──────────────────────────────────

    _inBounds(x, y) {
        return x >= 0 && y >= 0 && x < CFG.MAP_W && y < CFG.MAP_H;
    }

    _isWalkable(x, y) {
        return this._inBounds(x, y) && this.dungeon.tiles[y][x] !== CFG.T.WALL;
    }

    _moveEntity(entity, nx, ny) {
        this.occupied.delete(`${entity.gx},${entity.gy}`);
        entity.gx = nx;
        entity.gy = ny;
        this.occupied.set(`${nx},${ny}`, entity);
        entity.sprite.setPosition(nx * CFG.TILE + CFG.TILE / 2, ny * CFG.TILE + CFG.TILE / 2);
    }

    _snapshotPositions() {
        return this.party.map(p => ({ x: p.gx, y: p.gy }));
    }

    _adjacentEnemies(member) {
        return [[1,0],[-1,0],[0,1],[0,-1]].map(([dx, dy]) =>
            this.occupied.get(`${member.gx + dx},${member.gy + dy}`)
        ).filter(e => e && e.isEnemy && e.alive);
    }

    _nearestPartyMember(enemy) {
        let nearest = null, best = Infinity;
        for (const m of this.party) {
            if (!m.alive) continue;
            const d = Math.abs(enemy.gx - m.gx) + Math.abs(enemy.gy - m.gy);
            if (d < best) { best = d; nearest = m; }
        }
        return nearest;
    }

    // Finds the closest free walkable tile to (cx, cy), avoiding `exclude` positions
    _findFreeFloor(cx, cy, exclude) {
        const offsets = [
            [0,0],[1,0],[-1,0],[0,1],[0,-1],
            [1,1],[-1,1],[1,-1],[-1,-1],
            [2,0],[-2,0],[0,2],[0,-2],
        ];
        for (const [dx, dy] of offsets) {
            const x = cx + dx, y = cy + dy;
            const key = `${x},${y}`;
            if (this._isWalkable(x, y) &&
                !this.occupied.has(key) &&
                !exclude.some(p => p.x === x && p.y === y)) {
                return { x, y };
            }
        }
        return { x: cx, y: cy };
    }

    // ─────────────────────────────────── UI BRIDGE ────────────────────────────────

    _uiUpdate() {
        const ui = this.scene.get('UIScene');
        if (!ui?.sys.isActive()) return;
        ui.updateParty(this.party);
        ui.updateFloor(this.floor);
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
