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
      }).bind("death", function(d){
        d.victim.die();
        console.log("haha", d);
      });
      this.bombers = [];
      this.bombs = [];
    },
    drawNewPlayer: function(info){
      var new_player = Crafty.e("Bomberman ,"+(info.userId==pname ? "Human":"Distant")+", 2D, Canvas, Collision, "
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
        var flameHit = this.hit('Flame');
        if(flameHit) {
          Crafty.trigger("death", { victim:this, cause:flameHit[0].obj});
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

          Crafty.DrawManager.drawAll();
        }, flame.time);
      }
      this.flames[flame.name].push(flame);
    }
  });

  Crafty.c("Bomberman", {
      dropBomb: function(d) {
        if(typeof(d)=='undefined') d = null;
        var bPos = this.bombPos(this.getPos());
        if(this.human) {
          if(!this.world.isFree(bPos)) return;

          if(this.justDropped.length > 1)this.justDropped.shift();
          this.justDropped.push(this.nextBombName());
        }
        var bomb = Crafty.e("Bomb, 2D, Canvas, SpriteAnimation, bombsprite, Collision")
        .attr(bPos)
        .attr({
            name: (d) ? d.name : this.justDropped[this.justDropped.length-1],
            time:3000,
            flameTime:1000,
            flameSize:3
        })
        .animate('BombScaling', 0, 0, 6)
        .animate('BombScaling', 100, -1);
        this.world.putBomb(bomb);
        if(this.human)
          _socket.sendData("bomb", {
            "userId": this.userId,
            "name":bomb.name,
            "x":bomb.x,
            "y":bomb.y,
            "flameSize":bomb.flameSize,
            "flameTime":bomb.flameTime
          });
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
      },
      die: function() {
        this.destroy();
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
            x:this.x,
            y:this.y,
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
        setTimeout(function(){ that.timer()}, 10);
      },
      timer : function() {
        if(this.life>0) this.grow();
        this.world.registerFlame(this);
        var hitBomber = this.hit("Bomberman");
        if(hitBomber) hitBomber[0].obj.die();
      },
      grow: function(){
        for(i=0;i<this.growTo.length;i++) {
          var gTo = this.growTo[i];
            if(!this.world.blocks('flame', {x:this.x+gTo.x*MULT_FACTOR,y: this.y+gTo.y*MULT_FACTOR}))
              Crafty.e("Flame, 2D, Canvas, "+((this.life==1)?"flameleafsprite":"flamesprite")+", Collision")
              .attr({
                  x:this.x+gTo.x*MULT_FACTOR,
                  y:this.y+gTo.y*MULT_FACTOR,
                  name:this.name,
                  time:this.time,
                  world:this.world,
                  growTo:[gTo],
                  life:this.life-1,
                  rotation:((gTo.x!=0)?90:0)+((this.life==1)?((gTo.y==1||gTo.x==-1)?180:0):0)
              })
              .origin("center")
              .collision(new Crafty.polygon([5,5],[25,5],[25,25],[5,25]))
              ;
        }
      }
  });

  Crafty.c("Human", {
      init: function(userId) {
        this.addComponent("Fourway")
        .fourway(3)
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

})
function createPlayer(info) {
  if(info.userId==pname)
    info.move={left:true,right:true,up:true,down:true}
  else
    info.move={left:false,right:false,up:false,down:false}
  Crafty.trigger("player_in", info);
}

