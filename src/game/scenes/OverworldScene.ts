import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { NPC, DEFAULT_NPC } from '../objects/NPC';
import { GameState } from '../GameState';

const TILE_SIZE = 32;
const MAP_COLS = 20;
const MAP_ROWS = 15;

// 1 = suelo, 2 = pared (colisión)
const MAP_LAYOUT: number[][] = [
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,1,1,2,2,1,1,1,1,1,1,1,1,1,2,2,1,1,1,2],
  [2,1,1,2,2,1,1,1,1,1,1,1,1,1,2,2,1,1,1,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,1,1,2,2,1,1,1,1,1,1,1,1,1,2,2,1,1,1,2],
  [2,1,1,2,2,1,1,1,1,1,1,1,1,1,2,2,1,1,1,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private npc!: NPC;
  private collisionMap!: boolean[][];
  private npcTiles!: Set<string>;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialogBox!: Phaser.GameObjects.Container;
  private dialogText!: Phaser.GameObjects.Text;
  private dialogLines: string[] = [];
  private dialogIndex = 0;
  private dialogActive = false;
  private dialogFullyShown = false;
  private typewriterEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  create(): void {
    this.buildCollisionMap();
    this.drawMap();

    this.npcTiles = new Set([`${DEFAULT_NPC.tileX},${DEFAULT_NPC.tileY}`]);

    const saved = GameState.getPlayerPosition();
    this.player = new Player(this, saved.tileX, saved.tileY, this.collisionMap, this.npcTiles);

    this.npc = new NPC(this, DEFAULT_NPC);

    const npcState = GameState.getNPCState(DEFAULT_NPC.id);
    this.npc.showBattleResult(npcState.battleResult);

    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.buildDialogBox();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setZoom(2);

    // Recibir resultado del combate al volver
    const data = this.scene.settings.data as { battleResult?: string; npcId?: string } | undefined;
    if (data?.battleResult && data.npcId) {
      const result = data.battleResult as 'player_won' | 'player_lost';
      GameState.setNPCBattleResult(data.npcId, result);
      this.npc.showBattleResult(result);
      if (result === 'player_lost') {
        GameState.resetPlayerHp();
      }
    }
  }

  update(): void {
    if (this.dialogActive) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.advanceDialog();
      }
      return;
    }

    this.player.update();
    this.checkNPCProximity();
  }

  private buildCollisionMap(): void {
    this.collisionMap = MAP_LAYOUT.map(row => row.map(cell => cell === 2));
  }

  private drawMap(): void {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileKey = MAP_LAYOUT[row][col] === 2 ? 'tile_wall' : 'tile_ground';
        this.add.image(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2, tileKey);
      }
    }
  }

  private checkNPCProximity(): void {
    const px = this.player.getTileX();
    const py = this.player.getTileY();
    const nx = this.npc.tileX;
    const ny = this.npc.tileY;
    const dir = this.player.getDirection();

    const adjacent =
      (dir === 'up'    && px === nx && py - 1 === ny) ||
      (dir === 'down'  && px === nx && py + 1 === ny) ||
      (dir === 'left'  && py === ny && px - 1 === nx) ||
      (dir === 'right' && py === ny && px + 1 === nx);

    this.npc.showInteractHint(adjacent);

    if (adjacent && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startDialog();
    }
  }

  private startDialog(): void {
    const npcState = GameState.getNPCState(DEFAULT_NPC.id);

    if (npcState.battleResult === 'player_won') {
      this.dialogLines = ['Ya me has derrotado... sigue tu camino.'];
    } else {
      this.dialogLines = DEFAULT_NPC.dialogLines;
    }

    this.dialogIndex = 0;
    this.dialogActive = true;
    this.dialogBox.setVisible(true);
    this.showDialogLine(this.dialogLines[0]);
  }

  private showDialogLine(line: string): void {
    this.dialogFullyShown = false;
    this.dialogText.setText('');
    let charIndex = 0;

    this.typewriterEvent?.remove();
    this.typewriterEvent = this.time.addEvent({
      delay: 30,
      repeat: line.length - 1,
      callback: () => {
        this.dialogText.setText(line.slice(0, ++charIndex));
        if (charIndex >= line.length) this.dialogFullyShown = true;
      },
    });
  }

  private advanceDialog(): void {
    if (!this.dialogFullyShown) {
      this.typewriterEvent?.remove();
      this.dialogText.setText(this.dialogLines[this.dialogIndex]);
      this.dialogFullyShown = true;
      return;
    }

    this.dialogIndex++;

    if (this.dialogIndex < this.dialogLines.length) {
      this.showDialogLine(this.dialogLines[this.dialogIndex]);
      return;
    }

    // Último diálogo completado
    this.dialogBox.setVisible(false);
    this.dialogActive = false;

    const npcState = GameState.getNPCState(DEFAULT_NPC.id);
    if (npcState.battleResult !== 'player_won') {
      this.launchBattle();
    }
  }

  private launchBattle(): void {
    this.cameras.main.fade(500, 0, 0, 0, false, (_: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.start('BattleScene', {
          npcConfig: DEFAULT_NPC,
          playerCombatant: GameState.getPlayer(),
        });
      }
    });
  }

  private buildDialogBox(): void {
    const { width, height } = this.cameras.main;
    // El diálogo usa coordenadas fijas de cámara; lo ponemos en una UI scene o en coords de scroll
    const boxW = 480;
    const boxH = 80;
    const boxX = (MAP_COLS * TILE_SIZE - boxW) / 2;
    const boxY = MAP_ROWS * TILE_SIZE - boxH - 8;

    const bg = this.add.rectangle(0, 0, boxW, boxH, 0x000000, 0.85).setOrigin(0, 0);
    const border = this.add.rectangle(0, 0, boxW, boxH).setStrokeStyle(2, 0xffffff).setFillStyle(0, 0).setOrigin(0, 0);

    this.dialogText = this.add.text(12, 12, '', {
      fontSize: '13px',
      color: '#ffffff',
      wordWrap: { width: boxW - 24 },
    });

    const hint = this.add.text(boxW - 10, boxH - 10, '▶ Space', {
      fontSize: '10px',
      color: '#aaaaaa',
    }).setOrigin(1, 1);

    this.dialogBox = this.add.container(boxX, boxY, [bg, border, this.dialogText, hint]);
    this.dialogBox.setVisible(false);
    this.dialogBox.setScrollFactor(0);

    void width; void height; // usados implícitamente por la cámara
  }
}
