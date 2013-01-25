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
  Crafty.sprite(30, "/assets/images/bois.png", { cratesprite: [0,0]})
  Crafty.sprite(30, "/assets/images/wall.png", { wallsprite: [0,0]})
  Crafty.sprite(30, "/assets/images/bomb.png", { bombsprite: [0,0]})
  Crafty.sprite(30, "/assets/images/flammes.png", {
    flamesprite: [0,0],
    flame4sprite: [2,2],
    flameleafsprite_left: [0,2],
    flameleafsprite_right: [4,2],
    flameleafsprite_up: [2,0],
    flameleafsprite_down: [2,4],
    flamesprite_left: [1,2],
    flamesprite_right: [4,2],
    flamesprite_up: [2,1],
    flamesprite_down: [2,1]
  })

  Crafty.sprite(30, "/assets/images/bombe-bonus.png", { b_bombsprite: [0,0]})
  Crafty.sprite(30, "/assets/images/speed-bonus.png", { b_speedsprite: [0,0]})
  Crafty.sprite(30, "/assets/images/feu-bonus.png", { b_flamesprite: [0,0]})

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

      var _elemType,
          _elemSprite;

      if(elem.kind == Config.WALL) {
        _elemType ="wall";
        _elemSprite = "wallsprite";
      } else if(elem.kind == Config.GROUND) {
        _elemType ="ground";
        _elemSprite = "grasssprite";
      } else if(elem.kind == Config.CRATE || (elem.kind >= 20 && elem.kind < 30)) {
        _elemType ="crate";
        _elemSprite = "cratesprite";
      } else if(elem.kind >= 30 && elem.kind < 40) {
        _elemType ="Bonus, ";
        switch(elem.kind) {
          case Config.B_BOMB :
              _elemType += "b_bomb";
              _elemSprite = "b_bombsprite";
            break;
          case Config.B_SPEED  :
              _elemType += "b_speed";
              _elemSprite = "b_speedsprite";
            break;
          case Config.B_FLAME :
              _elemType += "b_flame";
              _elemSprite = "b_flamesprite";
        }
      }

      var genStr = _elemType+", 2D, Canvas, "+_elemSprite+", Collision";
      var cElem = Crafty.e(genStr)
      .attr(this.gridToPx(elem.coord))
      .attr({kind:elem.kind})
      .bind("destroy"+elem.coord.x+"-"+elem.coord.y, function(d){
          //this.destroy();
      });

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
            justDropped:[],
            maxBomb:1
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
        var bonusHit = this.hit('Bonus');
        if(bonusHit) {
          this.bonus(bonusHit[0].obj.kind);
          bonusHit[0].obj.destroy();
          this.world.clearPos({
            "x" : bonusHit[0].obj.x,
            "y" : bonusHit[0].obj.y
          });

          _socket.sendData("destroy", {
            "userId" : pname,
            "coord" : {
              "x" : bonusHit[0].obj.x,
              "y" : bonusHit[0].obj.y
            }
          });
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
    clearPos : function(pos) {
      var gPos = this.pxToGrid(pos);
      this.drawNewBoardElem({
        "coord" : gPos,
        "kind" : Config.GROUND
      });
    },
    burns: function(pos) {
      if(this.hashBombPos(pos) in this.bombs) {
        this.bombs[this.hashBombPos(pos)].explode();
        return true;
      }
      var gPos = this.pxToGrid(pos);
      if(typeof this.board[gPos.x] == 'undefined') return false;
      if(typeof this.board[gPos.x][gPos.y] == 'undefined') return false;

      var eKind = this.board[gPos.x][gPos.y].kind;
      if(eKind == Config.CRATE ||
          (eKind >= 20
           && eKind < 30)) {

        this.board[gPos.x][gPos.y].destroy();

        var _kind = (eKind == Config.CRATE) ?
          Config.GROUND : eKind + 10;
        this.drawNewBoardElem({
          "coord" : gPos,
          "kind" : _kind
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
    },
    nbBombsDropped: function(userId) {
      var match = [];
      for(i in this.bombs)
        if(this.bombs[i].owner == userId)
          match.push(this.bombs[i]);

      return match;
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
      })
      .collision()//new Crafty.polygon([0,0],[30,0],[30,30],[0,30]))
      ;

    }).bind("destroy", function(d){
      this.clearPos({
      "x": d.coord.x,
      "y": d.coord.y
      });
    });
  });
  Bomber = Crafty.scene("main");


  $("#imReady").click(function(e) {
   _socket.sendData("ready", {
     "userId":pname,
     "ready": ($("#imReady").attr("readyState") == "true") ? false : true
   });
  });
});
function createPlayer(info) {
  if(info.userId==pname)
    info.move={left:true,right:true,up:true,down:true}
  else
    info.move={left:false,right:false,up:false,down:false}
  Crafty.trigger("player_in", info);
}

