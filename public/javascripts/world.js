$(function(){
  var Bomber = null;
  Crafty.init(Config.GAME_W, Config.GAME_H);

  //TODO AN ACTUAL LOADING SCENE
  //TODO LOAD THE SPRITES DURING LOADING SCENE
  Crafty.scene("loading", function () {
    Crafty.background("#000");
    Crafty.e("2D, DOM, Text").attr({ w: 100, h: 20, x: 150, y: 120 })
    .text("Loading")
    .css({ "text-align": "center" });
  });
  Crafty.scene("loading");

  //TODO GROUP THE SPRITES
  Crafty.sprite(30, "/assets/images/bomber-white-classic.png", { classicsprite: [0, 0]});
  Crafty.sprite(30, "/assets/images/bomber-white-punk.png", { punksprite: [0, 0]});
  Crafty.sprite(30, "/assets/images/bomber-miner.png", { minersprite: [0, 0]});
  Crafty.sprite(30, "/assets/images/bomber-white-robot.png", { robotsprite: [0, 0]});

  Crafty.sprite(30, "/assets/images/grass.png", { grasssprite: [0,0]})
  Crafty.sprite(30, "/assets/images/crate.png", { cratesprite: [0,0]})
  Crafty.sprite(30, "/assets/images/bois.png", { wallsprite: [0,0]})
  Crafty.sprite(30, "/assets/images/bomb.png", { bombsprite: [0,0]})
  Crafty.sprite(30, "/assets/images/flame.png", { flamesprite: [0,0], flame4sprite: [0,1], flameleafsprite: [0,2]})

  Crafty.c("World", {
    init: function() {
      this.bind("player_in", function(info){
        humane.log(info.userId+" has joined");
        this.drawNewPlayer(info);
      }).bind("board", function(b){
        this.board=[];
        for(i in b.elements) {
          this.drawNewBoardElem(b.elements[i]);
        }
      }).bind("death", function(d){
        d.victim.die();
        console.log("haha", d);
      });
      this.flames = [];
      this.bombers = [];
      this.bombs = [];
    },
    pxToGrid : function(pos){
      return {
          x:Math.floor(pos.x/Config.BLOCK_SIZE),
          y:Math.floor(pos.y/Config.BLOCK_SIZE)
        }
    },
    gridToPx : function(pos){
      return {
          x:pos.x*Config.BLOCK_SIZE,
          y:pos.y*Config.BLOCK_SIZE
        }
    },
    drawNewBoardElem: function(elem) {
      if(typeof this.board[elem.coord.x] == 'undefined') this.board[elem.coord.x] = [];

      if(elem.kind == Config.WALL)
        var genStr = "wall, 2D, Canvas, wallsprite, Collision";
      else if(elem.kind == Config.GROUND)
        var genStr = "ground, 2D, Canvas, grasssprite, Collision";
      else if(elem.kind == Config.CRATE)
        var genStr = "crate, 2D, Canvas, cratesprite, Collision";

      var cElem = Crafty.e(genStr)
      .attr(this.gridToPx(elem.coord))
      .attr({kind:elem.kind});

      this.board[elem.coord.x][elem.coord.y] = cElem;
    },
    drawNewPlayer: function(info){
      var new_player =
        Crafty.e("Bomberman ,"+(info.userId==pname ? "Human":"Distant")
            +", 2D, Canvas, Collision, "
            +info.style+"sprite")
        .attr(
          {
            x:200,
            y:200,
            z:9999,
            human:info.userId==pname ? true:false,
            userId:info.userId,
            xspeed:0,
            yspeed:0,
            move:info.move,
            world:this,
            justDropped:[]
        }).bind("newDirection"+info.userId,
          function(dir){
            this.xspeed = dir.x;
            this.yspeed = dir.y;
            this.x = dir.position.x;
            this.y = dir.position.y;
          }
      ).bind('Moved', function(from) {
        var changed=false;
        if (this.hit('wall') || this.hit('crate')) {
          this.attr({x: from.x, y:from.y});
          changed=true;
        }
        var bombHit = this.hit('Bomb');
        if (bombHit) {
          if(this.justDropped.indexOf(bombHit[0].obj.name) == -1) {
            this.attr({x: from.x, y:from.y});
            changed=true;
          }
        }
        else {
          this.justDropped = [];
        }
        var flameHit = this.hit('Flame');
        if(flameHit) {
          this.burned(flameHit[0].obj);
        }
        if(changed)
          this.trigger('NewDirection', this._movement);
      }).bind("position"+info.userId,
          function(pos){
            this.x = pos.x;
            this.y = pos.y;
          }
      ).bind("deletePlayer"+info.userId,
          function() {
            this.destroy();
          }
      ).bind("dropBomb"+info.userId,
          function(d) {
            this.dropBomb(d);
          }
      ).collision(new Crafty.polygon([5,5],[23,5],[23,30],[5,30]))
      ;

      this.bombers.push(new_player);
    },
    hashBombPos: function(pos){
      return pos.x+" "+pos.y;
    },
    putBomb: function(bomb) {
      this.bombs[this.hashBombPos({x:bomb.x,y:bomb.y})] = bomb;
    },
    isFree: function(pos) {
      return !(this.hashBombPos(pos) in this.bombs)
        && !(this.elemAt(pos).kind == Config.WALL);
    },
    elemAt: function(pos){
      var gPos = this.pxToGrid(pos);
      if(gPos.x<0 || gPos.y<0) return null;
      return this.board[gPos.x][gPos.y];
    },
    burns: function(pos) {
      if(this.hashBombPos(pos) in this.bombs) {
        this.bombs[this.hashBombPos(pos)].explode();
        return true;
      }
      var gPos = this.pxToGrid(pos);
      if(this.board[gPos.x][gPos.y].kind == Config.CRATE) {
        this.board[gPos.x][gPos.y].destroy();
        this.drawNewBoardElem({
          "coord" : gPos,
          "kind" : Config.GROUND
        });
        return true;
      }
      return false;
    },
    blocks: function(what, pos) {
      switch(what){
        case 'flame':
          if(this.burns(pos)) return true;
          return (!this.isFree(pos));
          break;
        default:
          return false;
      }
    },
    registerFlame: function(flame) {
      if(!(flame.name in this.flames)) {
        this.flames[flame.name] = [];
        var that = this;

        setTimeout(function(){
          for(i in that.flames[flame.name])
            that.flames[flame.name][i].destroy();

          Crafty.DrawManager.drawAll();
        }, flame.time);
      }
      this.flames[flame.name].push(flame);
    }
  });
  Crafty.scene("main", function () {
    var world = Crafty.e("World")
    .bind("destroy-bomb", function(data){
      delete this.bombs[this.hashBombPos({x:data.x,y:data.y})];
      Crafty.e("Flame, 2D, Canvas, flame4sprite, Collision")
      .attr({
          x:data.x,
          y:data.y,
          time:data.time,
          name:data.name,
          world:this,
          growTo:[{x:-1,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1}],
          life:data.life
      });

    });
  });
  Bomber = Crafty.scene("main");
});
function createPlayer(info) {
  if(info.userId==pname)
    info.move={left:true,right:true,up:true,down:true}
  else
    info.move={left:false,right:false,up:false,down:false}
  Crafty.trigger("player_in", info);
}

