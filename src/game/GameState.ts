import { Move, PLAYER_MOVES } from './data/moves';

export type BattleResult = 'none' | 'player_won' | 'player_lost';

export interface Combatant {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: Move[];
}

export interface NPCState {
  id: string;
  battleResult: BattleResult;
}

interface PlayerPosition {
  tileX: number;
  tileY: number;
}

interface State {
  player: Combatant;
  playerPosition: PlayerPosition;
  npcs: Record<string, NPCState>;
}

const DEFAULT_PLAYER: Combatant = {
  name: 'Héroe',
  hp: 100,
  maxHp: 100,
  attack: 10,
  defense: 8,
  speed: 12,
  moves: PLAYER_MOVES,
};

class GameStateManager {
  private state: State = {
    player: { ...DEFAULT_PLAYER },
    playerPosition: { tileX: 5, tileY: 5 },
    npcs: {},
  };

  getPlayer(): Combatant {
    return this.state.player;
  }

  setPlayerHp(hp: number): void {
    this.state.player.hp = Math.max(0, Math.min(hp, this.state.player.maxHp));
  }

  resetPlayerHp(): void {
    this.state.player.hp = this.state.player.maxHp;
  }

  getPlayerPosition(): PlayerPosition {
    return this.state.playerPosition;
  }

  setPlayerPosition(tileX: number, tileY: number): void {
    this.state.playerPosition = { tileX, tileY };
  }

  getNPCState(id: string): NPCState {
    if (!this.state.npcs[id]) {
      this.state.npcs[id] = { id, battleResult: 'none' };
    }
    return this.state.npcs[id];
  }

  setNPCBattleResult(id: string, result: BattleResult): void {
    this.state.npcs[id] = { id, battleResult: result };
  }
}

// Singleton — compartido entre todas las escenas Phaser
export const GameState = new GameStateManager();
