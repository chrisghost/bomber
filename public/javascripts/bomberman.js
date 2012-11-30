$(function(){
  Crafty.init(300, 300);
  Crafty.scene("loading", function () {
    Crafty.background("#000");
    Crafty.e("2D, DOM, Text").attr({ w: 100, h: 20, x: 150, y: 120 })
    .text("Loading")
    .css({ "text-align": "center" });
  });
  Crafty.scene("loading");

  Crafty.sprite(29.5, "assets/images/bomber-white-classic.png", { classicsprite: [0, 0]});
  Crafty.sprite(29.5, "assets/images/bomber-white-punk.png", { punksprite: [0, 0]});
  Crafty.sprite(29.5, "assets/images/bomber-white-miner.png", { minersprite: [0, 0]});
  Crafty.sprite(29.5, "assets/images/bomber-white-robot.png", { robotsprite: [0, 0]});

  Crafty.c("World", {
    init: function() {
     this.bind("player_in", function(info){
        this.drawNewPlayer(info);
      });
      this.bombers = [];
    },
    drawNewPlayer: function(info){
      //console.log("2D, Canvas, Bomberman, "+info.style+"sprite"+(info.userId==getMyName() ? ", Human":""))
      var new_player = Crafty.e("2D, Canvas, Bomberman, "+info.style+"sprite"+(info.userId==getMyName() ? ", Human":""))
        .attr({x:200, y:200, userId:info.userId, xspeed:0, yspeed:0, move:info.move })
        .bind("newDirection"+info.userId,
          function(dir){
            this.xspeed = dir.x;
            this.yspeed = dir.y;
            this.x = dir.position.x;
            this.y = dir.position.y;
          }
      ).bind("position"+info.userId,
          function(pos){
            this.x = pos.x;
            this.y = pos.y;
          }
      ).bind("EnterFrame", function(){
        this.x+=this.xspeed;
        this.y+=this.yspeed;
      }).bind("deletePlayer"+info.userId,
          function() {
            this.destroy();
          }
      );

      console.log(new_player);
      this.bombers.push(new_player);
    }
  });

  Crafty.c("Human", {
      init: function(userId) {
        this.addComponent("Fourway")
        .fourway(1)
        .bind("NewDirection", function (e) {
          _socket.sendData({"userId": getMyName(),"x":e.x,"y":e.y, "position": {"x":this.x,"y":this.y} });
        });
      }
  });

  Crafty.scene("main", function () {
    var world = Crafty.e("World");
  });
  Crafty.scene("main");

})

function createPlayer(info) {
  if(info.userId==getMyName())
    info.move={left:true,right:true,up:true,down:true}
  else
    info.move={left:false,right:false,up:false,down:false}
  Crafty.trigger("player_in", info);
}
