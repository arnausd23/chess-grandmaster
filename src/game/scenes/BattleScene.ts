import Phaser from 'phaser';
import { Combatant } from '../GameState';
import { NPCConfig } from '../objects/NPC';
import { Move } from '../data/moves';

interface BattleData {
  npcConfig: NPCConfig;
  playerCombatant: Combatant;
}

type BattlePhase =
  | 'INTRO'
  | 'PLAYER_TURN'
  | 'ENEMY_TURN'
  | 'ANIMATING'
  | 'GAME_OVER';

export class BattleScene extends Phaser.Scene {
  private npcConfig!: NPCConfig;
  private player!: Combatant;
  private enemy!: Combatant;
  private phase: BattlePhase = 'INTRO';

  // UI elements
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private enemyHpBar!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private moveButtons: Phaser.GameObjects.Container[] = [];
  private moveButtonsContainer!: Phaser.GameObjects.Container;


  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleData): void {
    this.npcConfig = data.npcConfig;
    this.player = { ...data.playerCombatant };
    this.enemy = {
      name: data.npcConfig.name,
      ...data.npcConfig.combatant,
    };
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Fondo
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    this.buildBattleUI();
    this.cameras.main.fadeIn(400);

    this.showLog(`¡${this.enemy.name} quiere combatir!`);
    this.time.delayedCall(1200, () => {
      this.phase = 'PLAYER_TURN';
      this.showMoveButtons(true);
    });
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  private buildBattleUI(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Sprites
    this.enemySprite = this.add.image(W * 0.65, H * 0.28, 'enemy_battle').setOrigin(0.5);
    this.playerSprite = this.add.image(W * 0.25, H * 0.55, 'player_battle').setOrigin(0.5);

    // Paneles de stats
    this.buildStatPanel(W * 0.02, H * 0.04, this.enemy.name, false);
    this.buildStatPanel(W * 0.52, H * 0.42, this.player.name, true);

    // Log de batalla
    const logBg = this.add.rectangle(W * 0.01, H * 0.74, W * 0.98, H * 0.10, 0x000000, 0.8).setOrigin(0);
    void logBg;
    this.logText = this.add.text(W * 0.03, H * 0.75, '', {
      fontSize: '13px',
      color: '#ffffff',
      wordWrap: { width: W * 0.94 },
    });

    // Contenedor de botones de movimiento
    this.moveButtonsContainer = this.add.container(W * 0.01, H * 0.85);
    this.buildMoveButtons();
    this.showMoveButtons(false);
  }

  private buildStatPanel(x: number, y: number, name: string, isPlayer: boolean): void {
    const panelW = 200;
    const panelH = 55;

    this.add.rectangle(x, y, panelW, panelH, 0x000000, 0.75).setOrigin(0);
    this.add.rectangle(x, y, panelW, panelH).setStrokeStyle(1, 0xffffff, 0.5).setFillStyle(0, 0).setOrigin(0);

    this.add.text(x + 8, y + 6, name, { fontSize: '12px', color: '#ffff88', fontStyle: 'bold' });
    this.add.text(x + 8, y + 22, 'HP', { fontSize: '10px', color: '#aaaaaa' });

    // Barra de HP (fondo)
    this.add.rectangle(x + 26, y + 28, 160, 10, 0x333333).setOrigin(0, 0.5);

    // Barra de HP (fill) — se actualiza con graphics
    const bar = this.add.graphics();
    if (isPlayer) {
      this.playerHpBar = bar;
      this.playerHpText = this.add.text(x + 8, y + 38, '', { fontSize: '9px', color: '#aaaaaa' });
    } else {
      this.enemyHpBar = bar;
      this.enemyHpText = this.add.text(x + 8, y + 38, '', { fontSize: '9px', color: '#aaaaaa' });
    }

    this.updateHpBar(isPlayer ? this.playerHpBar : this.enemyHpBar, x + 26, y + 28, 160, isPlayer ? this.player : this.enemy);
    this.updateHpText(isPlayer ? this.playerHpText : this.enemyHpText, isPlayer ? this.player : this.enemy);
  }

  private updateHpBar(bar: Phaser.GameObjects.Graphics, x: number, y: number, maxW: number, combatant: Combatant): void {
    const ratio = Math.max(0, combatant.hp / combatant.maxHp);
    const color = ratio > 0.5 ? 0x4ade80 : ratio > 0.25 ? 0xfacc15 : 0xf87171;
    bar.clear();
    bar.fillStyle(color);
    bar.fillRect(x, y - 5, Math.round(maxW * ratio), 10);
  }

  private updateHpText(text: Phaser.GameObjects.Text, combatant: Combatant): void {
    text.setText(`${combatant.hp} / ${combatant.maxHp}`);
  }

  private buildMoveButtons(): void {
    const W = this.cameras.main.width;
    const btnW = (W * 0.98) / 2 - 4;
    const btnH = 32;

    this.player.moves.forEach((move, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = col * (btnW + 4);
      const by = row * (btnH + 4);

      const bg = this.add.rectangle(0, 0, btnW, btnH, 0x1e3a5f, 1)
        .setStrokeStyle(1, 0x4a90d9)
        .setOrigin(0);

      const label = this.add.text(8, 8, move.name, {
        fontSize: '12px',
        color: '#ffffff',
      });

      const btn = this.add.container(bx, by, [bg, label]);
      btn.setSize(btnW, btnH);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => bg.setFillStyle(0x2d5a8e));
      btn.on('pointerout',  () => bg.setFillStyle(0x1e3a5f));
      btn.on('pointerdown', () => this.onPlayerMove(move));

      this.moveButtonsContainer.add(btn);
      this.moveButtons.push(btn);
    });

    // Botón Huir
    const fleeX = (this.player.moves.length % 2 === 0 ? 0 : (btnW + 4));
    const fleeY = Math.floor(this.player.moves.length / 2) * (btnH + 4);
    const fleeBg = this.add.rectangle(0, 0, btnW, btnH, 0x5f1e1e, 1)
      .setStrokeStyle(1, 0xd94a4a)
      .setOrigin(0);
    const fleeLabel = this.add.text(8, 8, 'Huir', { fontSize: '12px', color: '#ffffff' });
    const fleeBtn = this.add.container(fleeX, fleeY, [fleeBg, fleeLabel]);
    fleeBtn.setSize(btnW, btnH);
    fleeBtn.setInteractive({ useHandCursor: true });
    fleeBtn.on('pointerover', () => fleeBg.setFillStyle(0x8e2d2d));
    fleeBtn.on('pointerout',  () => fleeBg.setFillStyle(0x5f1e1e));
    fleeBtn.on('pointerdown', () => this.onFlee());
    this.moveButtonsContainer.add(fleeBtn);
    this.moveButtons.push(fleeBtn);
  }

  private showMoveButtons(visible: boolean): void {
    this.moveButtonsContainer.setVisible(visible);
  }

  // ─── COMBAT LOGIC ─────────────────────────────────────────────────────────

  private onPlayerMove(move: Move): void {
    if (this.phase !== 'PLAYER_TURN') return;
    this.phase = 'ANIMATING';
    this.showMoveButtons(false);

    const goFirst = this.player.speed >= this.enemy.speed;

    if (goFirst) {
      this.executeMove(this.player, this.enemy, move, 'player', () => {
        if (this.enemy.hp <= 0) { this.endBattle('player_won'); return; }
        this.executeEnemyTurn(() => {
          if (this.player.hp <= 0) { this.endBattle('player_lost'); return; }
          this.phase = 'PLAYER_TURN';
          this.showMoveButtons(true);
        });
      });
    } else {
      this.executeEnemyTurn(() => {
        if (this.player.hp <= 0) { this.endBattle('player_lost'); return; }
        this.executeMove(this.player, this.enemy, move, 'player', () => {
          if (this.enemy.hp <= 0) { this.endBattle('player_won'); return; }
          this.phase = 'PLAYER_TURN';
          this.showMoveButtons(true);
        });
      });
    }
  }

  private executeEnemyTurn(onComplete: () => void): void {
    const move = Phaser.Utils.Array.GetRandom(this.enemy.moves) as Move;
    this.executeMove(this.enemy, this.player, move, 'enemy', onComplete);
  }

  private executeMove(
    attacker: Combatant,
    defender: Combatant,
    move: Move,
    side: 'player' | 'enemy',
    onComplete: () => void,
  ): void {
    if (move.type === 'status' && move.healPercent) {
      const healed = Math.round(attacker.maxHp * move.healPercent);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healed);
      this.showLog(`${attacker.name} usa ${move.name} y recupera ${healed} HP.`);
      this.refreshHpUI();
      this.time.delayedCall(900, onComplete);
      return;
    }

    const raw = (attacker.attack * move.power) / defender.defense;
    const variance = 0.85 + Math.random() * 0.15;
    const damage = Math.max(1, Math.round(raw * variance));
    defender.hp = Math.max(0, defender.hp - damage);

    this.showLog(`${attacker.name} usa ${move.name}. Causó ${damage} de daño.`);
    this.shakeSprite(side === 'player' ? this.enemySprite : this.playerSprite);
    this.refreshHpUI();
    this.time.delayedCall(900, onComplete);
  }

  private onFlee(): void {
    if (this.phase !== 'PLAYER_TURN') return;
    this.phase = 'ANIMATING';
    this.showMoveButtons(false);

    const chance = Math.min(0.9, Math.max(0.1, 0.5 + (this.player.speed - this.enemy.speed) * 0.05));
    if (Math.random() < chance) {
      this.showLog('¡Huiste con éxito!');
      this.time.delayedCall(1000, () => this.returnToOverworld(null));
    } else {
      this.showLog('¡No pudiste huir!');
      this.time.delayedCall(900, () => {
        this.executeEnemyTurn(() => {
          if (this.player.hp <= 0) { this.endBattle('player_lost'); return; }
          this.phase = 'PLAYER_TURN';
          this.showMoveButtons(true);
        });
      });
    }
  }

  // ─── END BATTLE ───────────────────────────────────────────────────────────

  private endBattle(result: 'player_won' | 'player_lost'): void {
    this.phase = 'GAME_OVER';
    const msg = result === 'player_won' ? '¡Has ganado el combate!' : '¡Has sido derrotado...';
    this.showLog(msg);

    const loser = result === 'player_won' ? this.enemySprite : this.playerSprite;
    this.tweens.add({
      targets: loser,
      alpha: 0,
      duration: 500,
      delay: 300,
    });

    this.time.delayedCall(2200, () => this.returnToOverworld(result));
  }

  private returnToOverworld(result: 'player_won' | 'player_lost' | null): void {
    this.cameras.main.fade(500, 0, 0, 0, false, (_: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.start('OverworldScene', {
          battleResult: result,
          npcId: result ? this.npcConfig.id : undefined,
        });
      }
    });
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private showLog(msg: string): void {
    this.logText.setText(msg);
  }

  private refreshHpUI(): void {
    const W = this.cameras.main.width;
    this.updateHpBar(this.playerHpBar, W * 0.52 + 26, W * 0.42 * 0 + this.cameras.main.height * 0.42 + 28, 160, this.player);
    this.updateHpBar(this.enemyHpBar,  W * 0.02 + 26, this.cameras.main.height * 0.04 + 28, 160, this.enemy);
    this.updateHpText(this.playerHpText, this.player);
    this.updateHpText(this.enemyHpText, this.enemy);
  }

  private shakeSprite(sprite: Phaser.GameObjects.Image): void {
    const origX = sprite.x;
    this.tweens.add({
      targets: sprite,
      x: { from: origX - 8, to: origX + 8 },
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => { sprite.x = origX; },
    });
    this.tweens.add({
      targets: sprite,
      alpha: { from: 1, to: 0.2 },
      duration: 80,
      yoyo: true,
      repeat: 2,
    });
  }
}
