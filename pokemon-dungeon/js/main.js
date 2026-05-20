const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: CFG.WIDTH,
    height: CFG.HEIGHT,
    backgroundColor: '#000000',
    scene: [MenuScene, GameScene, UIScene, GameOverScene, VictoryScene],
    pixelArt: false,
    parent: document.body,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        antialias: false,
        roundPixels: true,
    },
});
