$(function(){
  var GAME_W = 330;
  var GAME_H = 330;
  var MULT_FACTOR = 30;
  Crafty.init(GAME_W, GAME_H);
  Crafty.scene("loading", function () {
    Crafty.background("#000");
    Crafty.e("2D, DOM, Text").attr({ w: 100, h: 20, x: 150, y: 120 })
    .text("Loading")
    .css({ "text-align": "center" });
  });
  Crafty.scene("loading");

  Crafty.sprite(30, "/assets/images/bomber-white-classic.png", { classicsprite: [0, 0]});
  Crafty.sprite(30, "/assets/images/bomber-white-punk.png", { punksprite: [0, 0]});
  Crafty.sprite(30, "/assets/images/bomber-miner.png", { minersprite: [0, 0]});
  Crafty.sprite(30, "/assets/images/bomber-white-robot.png", { robotsprite: [0, 0]});

  Crafty.sprite(30, "/assets/images/grass.png", { grasssprite: [0,0]})
  Crafty.sprite(30, "/assets/images/bois.png", { wallsprite: [0,0]})

  Crafty.c("World", {
    init: function() {
      this.bind("player_in", function(info){
        humane.log(info.userId+" has joined");
        this.drawNewPlayer(info);
      }).bind("board", function(b){
        for(i in b.elements) {
          var elem = b.elements[i];
          if(elem.kind == 1)
            var genStr = "wall, 2D, Canvas, wallsprite, Collision";
          else
            var genStr = "ground, 2D, Canvas, grasssprite, Collision";
          Crafty.e(genStr)
          .attr({
              x:elem.coord.x*MULT_FACTOR,
              y:elem.coord.y*MULT_FACTOR
          });
        }
      });
      this.bombers = [];
    },
    drawNewPlayer: function(info){
      var new_player = Crafty.e("2D, Canvas, Bomberman, "+info.style+"sprite"+(info.userId==pname ? ", Human, Collision":", Distant"))
        .attr({x:200, y:200, z:9999, userId:info.userId, xspeed:0, yspeed:0, move:info.move })
        .bind("newDirection"+info.userId,
          function(dir){
            this.xspeed = dir.x;
            this.yspeed = dir.y;
            this.x = dir.position.x;
            this.y = dir.position.y;
          }
      ).bind('Moved', function(from) {
        if (this.hit('wall')) {
          this.attr({x: from.x, y:from.y});
        }
      }).bind("position"+info.userId,
          function(pos){
            this.x = pos.x;
            this.y = pos.y;
          }
      ).bind("deletePlayer"+info.userId,
          function() {
            this.destroy();
          }
      ).collision(new Crafty.polygon([2,5],[25,5],[25,30],[2,30]));

      console.log(new_player);
      this.bombers.push(new_player);
    }
  });

  Crafty.c("Human", {
      init: function(userId) {
        this.addComponent("Fourway")
        .fourway(1)
        .bind("NewDirection", function (e) {
          _socket.sendData("newDirection", {"userId": pname,"x":e.x,"y":e.y, "position": {"x":this.x,"y":this.y} });
        });
      }
  });
  Crafty.c("Distant", {
      init: function() {
        this.bind("EnterFrame", function(){
          this.x+=this.xspeed;
          this.y+=this.yspeed;
        });
      }
  });

  Crafty.scene("main", function () {
    var world = Crafty.e("World");
  });
  Crafty.scene("main");

})

function createPlayer(info) {
  if(info.userId==pname)
    info.move={left:true,right:true,up:true,down:true}
  else
    info.move={left:false,right:false,up:false,down:false}
  Crafty.trigger("player_in", info);
}
