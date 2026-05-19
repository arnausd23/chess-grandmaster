import Phaser from 'phaser';
import { GameState } from '../GameState';

export type Direction = 'up' | 'down' | 'left' | 'right';

const TILE_SIZE = 32;
const MOVE_DURATION = 180; // ms por tile

export class Player extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private tileX: number;
  private tileY: number;
  private isMoving = false;
  private direction: Direction = 'down';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private collisionMap: boolean[][];
  private npcTiles: Set<string>;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    collisionMap: boolean[][],
    npcTiles: Set<string>,
  ) {
    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE;
    super(scene, worldX, worldY);

    this.tileX = tileX;
    this.tileY = tileY;
    this.collisionMap = collisionMap;
    this.npcTiles = npcTiles;

    this.sprite = scene.add.image(0, 0, 'player').setOrigin(0.5, 0);
    this.add(this.sprite);
    scene.add.existing(this);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(): void {
    if (this.isMoving) return;

    let dx = 0;
    let dy = 0;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)    || Phaser.Input.Keyboard.JustDown(this.wasd.up as Phaser.Input.Keyboard.Key))    { dy = -1; this.direction = 'up'; }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)  || Phaser.Input.Keyboard.JustDown(this.wasd.down as Phaser.Input.Keyboard.Key))  { dy =  1; this.direction = 'down'; }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)  || Phaser.Input.Keyboard.JustDown(this.wasd.left as Phaser.Input.Keyboard.Key))  { dx = -1; this.direction = 'left'; }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!) || Phaser.Input.Keyboard.JustDown(this.wasd.right as Phaser.Input.Keyboard.Key)) { dx =  1; this.direction = 'right'; }

    if (dx === 0 && dy === 0) return;

    const nextX = this.tileX + dx;
    const nextY = this.tileY + dy;

    if (this.isTileBlocked(nextX, nextY)) return;

    this.isMoving = true;
    this.tileX = nextX;
    this.tileY = nextY;
    GameState.setPlayerPosition(nextX, nextY);

    this.scene.tweens.add({
      targets: this,
      x: nextX * TILE_SIZE + TILE_SIZE / 2,
      y: nextY * TILE_SIZE,
      duration: MOVE_DURATION,
      ease: 'Linear',
      onComplete: () => { this.isMoving = false; },
    });
  }

  private isTileBlocked(tx: number, ty: number): boolean {
    const rows = this.collisionMap.length;
    const cols = this.collisionMap[0]?.length ?? 0;
    if (tx < 0 || ty < 0 || ty >= rows || tx >= cols) return true;
    if (this.collisionMap[ty][tx]) return true;
    if (this.npcTiles.has(`${tx},${ty}`)) return true;
    return false;
  }

  getDirection(): Direction {
    return this.direction;
  }

  getTileX(): number {
    return this.tileX;
  }

  getTileY(): number {
    return this.tileY;
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }
}
