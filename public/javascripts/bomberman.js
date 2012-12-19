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

});
