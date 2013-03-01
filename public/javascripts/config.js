var Config = {
  "GAME_W" : 630,
  "GAME_H" : 330,
  "HUMAN_SPEED" : 3,
  "BLOCK_SIZE" : 30,
  "SPEED_BONUS_INCREASE" : 1,
  "FLAME_BONUS_INCREASE" : 1,
  "GROUND" : 0,
  "WALL" : 1,
  "CRATE" : 2,
  "C_BOMB" : 21,
  "C_SPEED" : 22,
  "C_FLAME" : 23,
  "B_BOMB" : 31,
  "B_SPEED" : 32,
  "B_FLAME" : 33,
  "KEYS" : {
    "up" : [ Crafty.keys['UP_ARROW'], Crafty.keys['K']],
    "down" : [Crafty.keys['DOWN_ARROW'], Crafty.keys['J']],
    "left" : [Crafty.keys['LEFT_ARROW'], Crafty.keys['H']],
    "right" : [Crafty.keys['RIGHT_ARROW'], Crafty.keys['L']],
    "dropBomb" : [Crafty.keys['SPACE'],  Crafty.keys['S']]
  },
  "DEFAULT_VALUES" : {
    "bombTime" : 2000,
    "flameTime" : 500,
    "flameSize" : 1,
    "maxBombs" : 1
  }
}
