$(function(){
  Crafty.c("Bomberman", {
      dropBomb: function(d) {
        if(typeof(d)=='undefined') d = null;
        var bPos = this.bombPos(this.getPos());
        if(this.human) {
          if(!this.canDropBomb()) return;
          if(!this.world.isFree(bPos)) return;

          if(this.justDropped.length > 1) this.justDropped.shift();
          this.justDropped.push(this.nextBombName());
        }
        if(d) this.flameSize = d.flameSize;

        var bomb = Crafty.e("Bomb, 2D, Canvas, SpriteAnimation, bombsprite, Collision")
        .attr(bPos)
        .attr({
            name: (d) ? d.name : this.justDropped[this.justDropped.length-1],
            time:this.bombTime,
            flameTime:this.flameTime,
            flameSize:this.flameSize,
            owner:this.userId
        })
        .animate('BombScaling', 0, 0, 6)
        .animate('BombScaling', 100, -1);
        this.world.putBomb(bomb);
        if(this.human) {
          _socket.sendData("bomb", {
            "userId": this.userId,
            "name":bomb.name,
            "x":bomb.x,
            "y":bomb.y,
            "flameSize":bomb.flameSize,
            "flameTime":bomb.flameTime
          });
        }
      },
      canDropBomb: function() {
        return this.maxBombs > this.world.nbBombsDropped(this.userId).length;
      },
      nextBombName : function() {
        if(typeof this.bombNum == 'undefined') this.bombNum = 0;
        this.bombNum += 1;
        return "bomb"+this.userId+this.bombNum;
      },
      bombPos : function(pos) {
        return {
          x:(pos.x-(pos.x%Config.BLOCK_SIZE)),
          y:(pos.y-(pos.y%Config.BLOCK_SIZE))
        };
      },
      getPos : function(){
        return {
          x:this.x+(this.w/2),
          y:this.y+(this.h/2)
        };
      },
      die: function() {
        _socket.sendData("death", { "userId": pname });
        this.destroy();
      },
      exploded: function(bomb) {
        console.log("bomb")
        Crafty.trigger("death", { victim: this, cause: bomb });
      },
      burnt: function(flame) {
        console.log("flame")
        Crafty.trigger("death", { victim: this, cause: flame });
      },
      bonus : function(kind) {
        switch (kind) {
          case Config.B_BOMB : this.incrementBombsNumber(); break;
          case Config.B_SPEED : this.incrementSpeed(); break;
          case Config.B_FLAME : this.incrementFlame(); break;
        }
      }
  });

  Crafty.c("Human", {
      init: function(userId) {
        this.addComponent("Multiway");

        this.multiway(Config.HUMAN_SPEED, this.getDirections());

        this.bind("NewDirection", function (e) {
          _socket.sendData("newDirection",
            { "userId": pname, "x":e.x, "y":e.y, "position": {"x":this.x,"y":this.y} }
          );
        });
        this.bind('KeyDown', function(e) {
          if(Config.KEYS.dropBomb.indexOf(e.key) != -1)
            Crafty.trigger("dropBomb"+this.userId);
        });

        this.bombTime = Config.DEFAULT_VALUES.bombTime;
        this.flameTime = Config.DEFAULT_VALUES.flameTime;
        this.flameSize = Config.DEFAULT_VALUES.flameSize;
        this.maxBombs = Config.DEFAULT_VALUES.maxBombs;
        //DEBUG
        var that = this;
        setInterval(function(){ that.updateHumanInfos(); }, 100);
      },
      getDirections: function() {
        return {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180};
      },
      updateHumanInfos: function() {
        var playerInfos = "Speed : "+this._speed.x+", "+this._speed.y;
        playerInfos += " | Bombs : "+this.maxBombs+" ("+this.world.nbBombsDropped(this.userId).length+")";
        playerInfos += " | FlameSize : "+this.flameSize;
        $('#bomberInfos').text(playerInfos);
      },
      incrementBombsNumber : function() {
        this.maxBombs += 1;
      },
      incrementSpeed : function() {
        this.multiway(this._speed.x + Config.SPEED_BONUS_INCREASE, this.getDirections());
      },
      incrementFlame: function() {
        this.flameSize += 1;
      }

  });
  Crafty.c("Distant", {
      init: function() {
        this.bind("EnterFrame", function(){
          this.x+=this.xspeed;
          this.y+=this.yspeed;
          this.bombTime = Config.DEFAULT_VALUES.bombTime;
          this.flameTime = Config.DEFAULT_VALUES.flameTime;
          this.flameSize = Config.DEFAULT_VALUES.flameSize;
          this.maxBombs = Config.DEFAULT_VALUES.maxBombs;
        });
      }
  });

});

