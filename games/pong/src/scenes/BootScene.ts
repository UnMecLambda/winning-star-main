import Phaser from 'phaser';
export class BootScene extends Phaser.Scene {
  constructor(){ super('boot'); }
  preload(){}
  create(){ this.scene.start('game'); }
}
