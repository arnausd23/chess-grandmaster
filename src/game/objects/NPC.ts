import Phaser from 'phaser';
import { BattleResult } from '../GameState';
import { Move, ENEMY_MOVES } from '../data/moves';

export interface NPCConfig {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  tileSize: number;
  dialogLines: string[];
  combatant: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    moves: Move[];
  };
}

export const DEFAULT_NPC: NPCConfig = {
  id: 'goblin_guard',
  name: 'Goblin Guardia',
  tileX: 10,
  tileY: 7,
  tileSize: 32,
  dialogLines: [
    '¡Alto ahí, viajero!',
    'Nadie pasa sin enfrentarse a mí.',
    '¡Prepárate para el combate!',
  ],
  combatant: {
    hp: 80,
    maxHp: 80,
    attack: 8,
    defense: 6,
    speed: 8,
    moves: ENEMY_MOVES,
  },
};

export class NPC extends Phaser.GameObjects.Container {
  readonly npcId: string;
  readonly config: NPCConfig;
  private sprite: Phaser.GameObjects.Image;
  private resultLabel: Phaser.GameObjects.Text | null = null;
  private interactHint: Phaser.GameObjects.Text | null = null;
  readonly tileX: number;
  readonly tileY: number;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    const worldX = config.tileX * config.tileSize + config.tileSize / 2;
    const worldY = config.tileY * config.tileSize;
    super(scene, worldX, worldY);

    this.npcId = config.id;
    this.config = config;
    this.tileX = config.tileX;
    this.tileY = config.tileY;

    this.sprite = scene.add.image(0, 0, 'npc').setOrigin(0.5, 0);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  showInteractHint(visible: boolean): void {
    if (visible && !this.interactHint) {
      this.interactHint = this.scene.add.text(0, -16, '[Space]', {
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 3, y: 2 },
      }).setOrigin(0.5, 1);
      this.add(this.interactHint);

      this.scene.tweens.add({
        targets: this.interactHint,
        alpha: { from: 1, to: 0.3 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else if (!visible && this.interactHint) {
      this.interactHint.destroy();
      this.interactHint = null;
    }
  }

  showBattleResult(result: BattleResult): void {
    if (this.resultLabel) {
      this.resultLabel.destroy();
      this.resultLabel = null;
    }
    if (result === 'none') return;

    const text   = result === 'player_won' ? '¡Derrotado!' : '¡Ganaste!';
    const color  = result === 'player_won' ? '#4ade80'     : '#f87171';

    this.resultLabel = this.scene.add.text(0, -28, text, {
      fontSize: '11px',
      color,
      backgroundColor: '#000000cc',
      padding: { x: 4, y: 2 },
      fontStyle: 'bold',
    }).setOrigin(0.5, 1);

    this.add(this.resultLabel);
  }

  isDefeated(): boolean {
    // Consultar desde fuera usando GameState — aquí solo accessor semántico
    return this.resultLabel?.text === '¡Derrotado!';
  }
}
