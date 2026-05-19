import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Placeholder sprites generados en código — se reemplazarán con assets pixel art reales
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('OverworldScene');
  }

  private createPlaceholderTextures(): void {
    // Jugador: rectángulo azul 16x32
    const playerGfx = this.make.graphics({ x: 0, y: 0 });
    playerGfx.fillStyle(0x4477ff);
    playerGfx.fillRect(0, 0, 16, 32);
    playerGfx.fillStyle(0x88aaff);
    playerGfx.fillRect(4, 4, 8, 8); // cabeza
    playerGfx.generateTexture('player', 16, 32);
    playerGfx.destroy();

    // NPC: rectángulo rojo 16x32
    const npcGfx = this.make.graphics({ x: 0, y: 0 });
    npcGfx.fillStyle(0xff4444);
    npcGfx.fillRect(0, 0, 16, 32);
    npcGfx.fillStyle(0xff8888);
    npcGfx.fillRect(4, 4, 8, 8);
    npcGfx.generateTexture('npc', 16, 32);
    npcGfx.destroy();

    // Tile de suelo: verde
    const groundGfx = this.make.graphics({ x: 0, y: 0 });
    groundGfx.fillStyle(0x3a7d44);
    groundGfx.fillRect(0, 0, 32, 32);
    groundGfx.lineStyle(1, 0x2d6035, 0.4);
    groundGfx.strokeRect(0, 0, 32, 32);
    groundGfx.generateTexture('tile_ground', 32, 32);
    groundGfx.destroy();

    // Tile de pared/obstáculo: marrón
    const wallGfx = this.make.graphics({ x: 0, y: 0 });
    wallGfx.fillStyle(0x8B6914);
    wallGfx.fillRect(0, 0, 32, 32);
    wallGfx.fillStyle(0x6B4F10);
    wallGfx.fillRect(2, 2, 28, 28);
    wallGfx.generateTexture('tile_wall', 32, 32);
    wallGfx.destroy();

    // Sprites de batalla (más grandes, vista frontal/espalda)
    const enemyBattleGfx = this.make.graphics({ x: 0, y: 0 });
    enemyBattleGfx.fillStyle(0xff4444);
    enemyBattleGfx.fillRect(0, 0, 96, 96);
    enemyBattleGfx.fillStyle(0xff8888);
    enemyBattleGfx.fillRect(24, 16, 48, 48);
    enemyBattleGfx.generateTexture('enemy_battle', 96, 96);
    enemyBattleGfx.destroy();

    const playerBattleGfx = this.make.graphics({ x: 0, y: 0 });
    playerBattleGfx.fillStyle(0x4477ff);
    playerBattleGfx.fillRect(0, 0, 96, 96);
    playerBattleGfx.fillStyle(0x88aaff);
    playerBattleGfx.fillRect(24, 16, 48, 48);
    playerBattleGfx.generateTexture('player_battle', 96, 96);
    playerBattleGfx.destroy();
  }
}
