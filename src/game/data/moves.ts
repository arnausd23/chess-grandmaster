export interface Move {
  name: string;
  power: number;
  type: 'physical' | 'magic' | 'status';
  description: string;
  healPercent?: number;
}

export const PLAYER_MOVES: Move[] = [
  { name: 'Ataque Normal', power: 40, type: 'physical', description: 'Un ataque básico.' },
  { name: 'Golpe Fuerte',  power: 80, type: 'physical', description: 'Un golpe poderoso.' },
  { name: 'Magia Básica',  power: 50, type: 'magic',    description: 'Un hechizo elemental.' },
  { name: 'Curación',      power: 0,  type: 'status',   description: 'Restaura el 30% del HP máximo.', healPercent: 0.30 },
];

export const ENEMY_MOVES: Move[] = [
  { name: 'Zarpazo', power: 35, type: 'physical', description: 'Una zarpa afilada.' },
  { name: 'Embestida', power: 55, type: 'physical', description: 'Una carga brutal.' },
];
