const MOVES = {
    tackle:       { name: 'Tackle',       power: 40,  pp: 35, type: 'Normal', range: 'single' },
    scratch:      { name: 'Scratch',      power: 40,  pp: 35, type: 'Normal', range: 'single' },
    bite:         { name: 'Bite',         power: 60,  pp: 25, type: 'Dark',   range: 'single' },
    vine_whip:    { name: 'Vine Whip',    power: 45,  pp: 25, type: 'Grass',  range: 'single' },
    razor_leaf:   { name: 'Razor Leaf',   power: 55,  pp: 25, type: 'Grass',  range: 'wide'   },
    growth:       { name: 'Growth',       power: 0,   pp: 20, type: 'Grass',  range: 'self',   effect: 'atk_up' },
    sleep_powder: { name: 'Sleep Powder', power: 0,   pp: 15, type: 'Grass',  range: 'room',   effect: 'sleep'  },
    ember:        { name: 'Ember',        power: 40,  pp: 25, type: 'Fire',   range: 'single' },
    fire_spin:    { name: 'Fire Spin',    power: 35,  pp: 15, type: 'Fire',   range: 'wide'   },
    slash:        { name: 'Slash',        power: 70,  pp: 20, type: 'Normal', range: 'single' },
    flamethrower: { name: 'Flamethrower', power: 95,  pp: 15, type: 'Fire',   range: 'single' },
    water_gun:    { name: 'Water Gun',    power: 40,  pp: 25, type: 'Water',  range: 'single' },
    bubble_beam:  { name: 'Bubble Beam',  power: 65,  pp: 20, type: 'Water',  range: 'wide'   },
    rapid_spin:   { name: 'Rapid Spin',   power: 20,  pp: 40, type: 'Normal', range: 'wide'   },
    withdraw:     { name: 'Withdraw',     power: 0,   pp: 40, type: 'Water',  range: 'self',   effect: 'def_up' },
};

const POKEMON = {
    bulbasaur:  { name:'Bulbasaur',  type:'Planta',   hp:45, atk:49, def:49, color:0x5ca935, letter:'B', moves:['tackle','vine_whip','razor_leaf','sleep_powder'] },
    charmander: { name:'Charmander', type:'Fuego',    hp:39, atk:52, def:43, color:0xf07030, letter:'C', moves:['scratch','ember','fire_spin','flamethrower'] },
    squirtle:   { name:'Squirtle',   type:'Agua',     hp:44, atk:48, def:65, color:0x4870d0, letter:'S', moves:['tackle','water_gun','bubble_beam','withdraw'] },

    rattata:    { name:'Rattata',    type:'Normal',   hp:30, atk:56, def:35, color:0x9050a0, letter:'R', isEnemy:true, floors:[1,4] },
    pidgey:     { name:'Pidgey',     type:'Volador',  hp:40, atk:45, def:40, color:0xb08820, letter:'P', isEnemy:true, floors:[1,5] },
    geodude:    { name:'Geodude',    type:'Roca',     hp:40, atk:80, def:100,color:0x806040, letter:'G', isEnemy:true, floors:[3,8] },
    ekans:      { name:'Ekans',      type:'Veneno',   hp:35, atk:60, def:44, color:0x6050a0, letter:'E', isEnemy:true, floors:[2,7] },
    machop:     { name:'Machop',     type:'Lucha',    hp:70, atk:80, def:50, color:0x8030d0, letter:'M', isEnemy:true, floors:[5,10] },
    gastly:     { name:'Gastly',     type:'Fantasma', hp:30, atk:35, def:30, color:0x504070, letter:'G', isEnemy:true, floors:[6,10] },
    growlithe:  { name:'Growlithe',  type:'Fuego',    hp:55, atk:70, def:45, color:0xe06020, letter:'G', isEnemy:true, floors:[4,9] },
    tentacool:  { name:'Tentacool',  type:'Agua',     hp:40, atk:40, def:35, color:0x2080c0, letter:'T', isEnemy:true, floors:[3,8] },
};

const ENEMY_KEYS = ['rattata','pidgey','geodude','ekans','machop','gastly','growlithe','tentacool'];

function getEnemiesForFloor(floor) {
    return ENEMY_KEYS.filter(k => {
        const [mn, mx] = POKEMON[k].floors;
        return floor >= mn && floor <= mx;
    });
}
