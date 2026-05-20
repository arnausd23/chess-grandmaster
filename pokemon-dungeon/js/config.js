const CFG = {
    TILE: 32,
    MAP_W: 56,
    MAP_H: 44,
    WIDTH: 896,
    HEIGHT: 640,
    MAX_FLOORS: 10,

    T: { WALL: 0, FLOOR: 1, CORRIDOR: 2, STAIRS: 3 },

    COLORS: {
        WALL:        0x16213e,
        WALL_SHADE:  0x0d1530,
        FLOOR:       0x3d2b1f,
        FLOOR_SHADE: 0x2d1f14,
        CORRIDOR:    0x2a1e13,
        STAIRS_BG:   0x3d2b1f,
        STAIRS_FG:   0xffd700,
        UI_BG:       0x0d1117,
        UI_TEXT:     0xe0e0e0,
        UI_DIM:      0x888888,
        PARTY_LEADER: 0xffd700,
    },

    SIGHT_RADIUS: 4,
    MOVE_DELAY: 160,
};
