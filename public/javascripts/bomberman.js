$(function(){
  var Bomber = null;
  var GAME_W = 330;
  var GAME_H = 330;
  var MULT_FACTOR = 30;
  var WALL = 1;
  var GROUND = 0;
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
  Crafty.sprite(30, "/assets/images/bomb.png", { bombsprite: [0,0]})
  Crafty.sprite(30, "/assets/images/flame.png", { flamesprite: [0,0], flame4sprite: [0,1], flameleafsprite: [0,2]})

  Crafty.c("World", {
    init: function() {
      this.bind("player_in", function(info){
        humane.log(info.userId+" has joined");
        this.drawNewPlayer(info);
        this.flames = [];
      }).bind("board", function(b){
        this.board=[];
        console.log(this.board);
        for(i in b.elements) {
          var elem = b.elements[i];
          if(typeof this.board[elem.coord.x] == 'undefined') this.board[elem.coord.x] = [];
          this.board[elem.coord.x][elem.coord.y] = elem.kind;
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
      this.bombs = [];
    },
    drawNewPlayer: function(info){
      var new_player = Crafty.e("2D, Canvas, Bomberman, Collision, "
                                +info.style+"sprite, "
                                +(info.userId==pname ? "Human":"Distant"))
        .attr(
          {
            x:200,
            y:200,
            z:9999,
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
        if (this.hit('wall')) {
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
          function() {
            this.dropBomb();
          }
      ).collision(new Crafty.polygon([2,5],[25,5],[25,30],[2,30]))
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
      //console.log(this.board[0], pos);
      return !(this.hashBombPos(pos) in this.bombs) && !(this.elemAt(pos) == WALL);
    },
    elemAt: function(pos){
      //console.log(Math.floor(pos.x/MULT_FACTOR));
      var x = Math.floor(pos.x/MULT_FACTOR);
      var y = Math.floor(pos.y/MULT_FACTOR);
      if(x<0 || y<0) return null;
      return this.board[x][y];
    },
    burns: function(pos) {
      //console.log(pos);
      if(this.hashBombPos(pos) in this.bombs) {
        this.bombs[this.hashBombPos(pos)].explode();
        return true;
      }
      return false;
    },
    blocks: function(what, pos) {
      //console.log(what, pos, this.isFree(pos));
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
        }, flame.time);
      }
      this.flames[flame.name].push(flame);
    }
  });

  Crafty.c("Bomberman", {
      dropBomb: function(pos) {
        console.log("dropBombn",pos);
        var bPos = this.bombPos(this.getPos());
        if(!this.world.isFree(bPos)) return;
        console.log("putting da Bom'");

        if(this.justDropped.length > 1)this.justDropped.shift();
        this.justDropped.push(this.nextBombName());
        var bomb = Crafty.e("Bomb, 2D, Canvas, SpriteAnimation, bombsprite, Collision")
        .attr(bPos)
        .attr({
            name:this.justDropped[this.justDropped.length-1],
            time:3000,
            flameTime:1000,
            flameSize:3
        })
        .animate('BombScaling', 0, 0, 6)
        .animate('BombScaling', 100, -1);
        this.world.putBomb(bomb);
      },
      nextBombName : function() {
        if(typeof this.bombNum == 'undefined') this.bombNum = 0;
        this.bombNum += 1;
        return "bomb"+this.userId+this.bombNum;
      },
      bombPos : function(pos) {
        return {
          x:(pos.x-(pos.x%MULT_FACTOR)),
          y:(pos.y-(pos.y%MULT_FACTOR))
        };
      },
      getPos : function(){
        return {
          x:this.x+(this.w/2),
          y:this.y+(this.h/2)
        };
      }
  });
  Crafty.c("Bomb", {
      init: function() {
        var that = this;
        this.burned=false;
        setTimeout(function(){ that.timer()}, 0);
      },
      timer : function() {
        //console.log(this.time);
        this.explosionClock = this.timeout(function () {
          console.log(this.burned);
          if(!this.burned)
          this.explode();
        }, this.time);
      },
      explode: function() {
        console.log('BOOM', this.explosionClock);
        clearTimeout(this.explosionClock);
        this.burned = true;
        console.log(this.explosionClock);
        Crafty.trigger("destroy-bomb", {
            pos: {x:this.x,y:this.y},
            time: this.flameTime,
            life:this.flameSize,
            name:this.name
        });
        this.destroy();
      }
  });
  Crafty.c("Flame", {
      init: function() {
        var that = this;
        setTimeout(function(){ that.timer()}, 0);
      },
      timer : function() {
        if(this.first) {
          setTimeout("Crafty.DrawManager.drawAll()", this.time+100);
          this.first = false;
        }
        if(this.life>0) this.grow();
        this.world.registerFlame(this);
        //this.timeout(function () {
          //console.log("destroy()");
          //this.destroy();
        //}, this.time);
      },
      grow: function(){
        for(i=0;i<this.growTo.length;i++) {
          var gTo = this.growTo[i];
          console.log(gTo);
            if(!this.world.blocks('flame', {x:this.x+gTo.x*MULT_FACTOR,y: this.y+gTo.y*MULT_FACTOR}))
              Crafty.e("2D, Canvas, Flame, "+((this.life==1)?"flameleafsprite":"flamesprite"))
              .attr({
                  x:this.x+gTo.x*MULT_FACTOR,
                  y:this.y+gTo.y*MULT_FACTOR,
                  name:this.name,
                  time:this.time,
                  world:this.world,
                  growTo:[gTo],
                  life:this.life-1,
                  rotation:((gTo.x!=0)?90:0)+((this.life==1)?((gTo.y==1||gTo.x==-1)?180:0):0)
              }).origin("center");
        }
      }
  });

  Crafty.c("Human", {
      init: function(userId) {
        this.addComponent("Fourway")
        .fourway(1)
        .bind("NewDirection", function (e) {
          _socket.sendData("newDirection", {"userId": pname,"x":e.x,"y":e.y, "position": {"x":this.x,"y":this.y} });
        });
        this.bind('KeyDown', function(e) {
          if(e.key == Crafty.keys['SPACE'] || e.key == Crafty.keys['S']){
            Crafty.trigger("dropBomb"+this.userId);
            console.log("dropBomb"+this.userId);
          }
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
    var world = Crafty.e("World")
    .bind("destroy-bomb", function(data){
      delete this.bombs[this.hashBombPos(data.pos)];
      Crafty.e("2D, Canvas, Flame, flame4sprite")
      .attr({
          x:data.pos.x,
          y:data.pos.y,
          first:true,
          time:data.time,
          name:data.name,
          world:this,
          growTo:[{x:-1,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1}],
          life:data.life
      });

    });
  });
  Bomber = Crafty.scene("main");

})
function createPlayer(info) {
  if(info.userId==pname)
    info.move={left:true,right:true,up:true,down:true}
  else
    info.move={left:false,right:false,up:false,down:false}
  Crafty.trigger("player_in", info);
}

