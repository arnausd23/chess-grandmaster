class DungeonGen {
    constructor(w, h) { this.w = w; this.h = h; }

    generate(floor) {
        const tiles = Array.from({length: this.h}, () => new Array(this.w).fill(CFG.T.WALL));
        const rooms = [];

        for (let attempt = 0; attempt < 300 && rooms.length < 12; attempt++) {
            const rw = 5 + Math.floor(Math.random() * 8);
            const rh = 4 + Math.floor(Math.random() * 6);
            const rx = 1 + Math.floor(Math.random() * (this.w - rw - 2));
            const ry = 1 + Math.floor(Math.random() * (this.h - rh - 2));

            const overlaps = rooms.some(r =>
                rx < r.x + r.w + 2 && rx + rw + 2 > r.x &&
                ry < r.y + r.h + 2 && ry + rh + 2 > r.y
            );

            if (!overlaps) {
                rooms.push({ x: rx, y: ry, w: rw, h: rh });
                for (let y = ry; y < ry + rh; y++)
                    for (let x = rx; x < rx + rw; x++)
                        tiles[y][x] = CFG.T.FLOOR;
            }
        }

        if (rooms.length < 2) return this.generate(floor);

        for (let i = 1; i < rooms.length; i++) {
            const a = rooms[i - 1], b = rooms[i];
            const ax = (a.x + a.w / 2) | 0, ay = (a.y + a.h / 2) | 0;
            const bx = (b.x + b.w / 2) | 0, by = (b.y + b.h / 2) | 0;

            if (Math.random() < 0.5) {
                hCorridor(tiles, ax, bx, ay);
                vCorridor(tiles, ay, by, bx);
            } else {
                vCorridor(tiles, ay, by, ax);
                hCorridor(tiles, ax, bx, by);
            }
        }

        const last = rooms[rooms.length - 1];
        const sx = (last.x + last.w / 2) | 0;
        const sy = (last.y + last.h / 2) | 0;
        tiles[sy][sx] = CFG.T.STAIRS;

        const first = rooms[0];
        const startX = (first.x + first.w / 2) | 0;
        const startY = (first.y + first.h / 2) | 0;

        const available = getEnemiesForFloor(floor);
        const numEnemies = Math.min(3 + floor * 2, 18);
        const enemies = [];

        for (let i = 0; i < numEnemies; i++) {
            const ri = 1 + Math.floor(Math.random() * (rooms.length - 1));
            const r = rooms[ri];
            const ex = r.x + Math.floor(Math.random() * r.w);
            const ey = r.y + Math.floor(Math.random() * r.h);
            if (!(ex === sx && ey === sy) && available.length > 0) {
                const key = available[Math.floor(Math.random() * available.length)];
                enemies.push({ x: ex, y: ey, key });
            }
        }

        const items = [];
        const numItems = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numItems; i++) {
            const ri = Math.floor(Math.random() * rooms.length);
            const r = rooms[ri];
            items.push({
                x: r.x + Math.floor(Math.random() * r.w),
                y: r.y + Math.floor(Math.random() * r.h),
                type: Math.random() < 0.65 ? 'berry' : 'elixir',
            });
        }

        return { tiles, rooms, startX, startY, enemies, items };
    }
}

function hCorridor(tiles, x1, x2, y) {
    const [a, b] = x1 < x2 ? [x1, x2] : [x2, x1];
    for (let x = a; x <= b; x++)
        if (tiles[y][x] === CFG.T.WALL) tiles[y][x] = CFG.T.CORRIDOR;
}

function vCorridor(tiles, y1, y2, x) {
    const [a, b] = y1 < y2 ? [y1, y2] : [y2, y1];
    for (let y = a; y <= b; y++)
        if (tiles[y][x] === CFG.T.WALL) tiles[y][x] = CFG.T.CORRIDOR;
}

// BFS pathfinding for enemy AI
function bfsStep(tiles, from, to, w, h) {
    if (Math.abs(from.x - to.x) + Math.abs(from.y - to.y) > 12) return null;

    const queue = [from];
    const visited = new Map();
    visited.set(`${from.x},${from.y}`, null);

    while (queue.length > 0) {
        const curr = queue.shift();
        if (curr.x === to.x && curr.y === to.y) {
            let node = curr;
            while (visited.get(`${node.x},${node.y}`) !== null) {
                const prev = visited.get(`${node.x},${node.y}`);
                if (prev.x === from.x && prev.y === from.y) return node;
                node = prev;
            }
            return null;
        }
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = curr.x + dx, ny = curr.y + dy;
            const k = `${nx},${ny}`;
            if (nx >= 0 && ny >= 0 && nx < w && ny < h &&
                tiles[ny][nx] !== CFG.T.WALL && !visited.has(k)) {
                visited.set(k, curr);
                queue.push({ x: nx, y: ny });
            }
        }
    }
    return null;
}
