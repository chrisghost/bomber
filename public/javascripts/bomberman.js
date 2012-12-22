$(function(){
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
        this.destroy();
      },
      burned: function(flame) {
        Crafty.trigger("death", { victim:this, cause:flame});
      }
  });

  Crafty.c("Human", {
      init: function(userId) {
        this.addComponent("Multiway");
        var dirControl = {};
        for(i in Config.KEYS.up)    dirControl[Config.KEYS.up[i]] = -90;
        for(i in Config.KEYS.down)  dirControl[Config.KEYS.down[i]] = 90;
        for(i in Config.KEYS.left)  dirControl[Config.KEYS.left[i]] = 180;
        for(i in Config.KEYS.right) dirControl[Config.KEYS.right[i]] = 0;

        this.multiway(Config.HUMAN_SPEED, dirControl);
        this.bind("NewDirection", function (e) {
          _socket.sendData("newDirection",
            { "userId": pname, "x":e.x, "y":e.y, "position": {"x":this.x,"y":this.y} }
          );
        });
        this.bind('KeyDown', function(e) {
          if(Config.KEYS.dropBomb.indexOf(e.key) != -1)
            Crafty.trigger("dropBomb"+this.userId);
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

});
