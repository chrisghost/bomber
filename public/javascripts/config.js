var Config = {
  "GAME_W" : 330,
  "GAME_H" : 330,
  "HUMAN_SPEED" : 3,
  "BLOCK_SIZE" : 30,
  "GROUND" : 0,
  "WALL" : 1,
  "CRATE" : 2,
  "KEYS" : {
    "up" : [ Crafty.keys['UP_ARROW'], Crafty.keys['K']],
    "down" : [Crafty.keys['DOWN_ARROW'], Crafty.keys['J']],
    "left" : [Crafty.keys['LEFT_ARROW'], Crafty.keys['H']],
    "right" : [Crafty.keys['RIGHT_ARROW'], Crafty.keys['L']],
    "dropBomb" : [Crafty.keys['SPACE'],  Crafty.keys['S']]
  },
  "DEFAULT_VALUES" : {
    "bombTime" : 2000,
    "flameTime" : 1000,
    "flameSize" : 1
  }
}
