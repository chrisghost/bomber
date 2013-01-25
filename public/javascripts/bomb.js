$(function(){
  Crafty.c("Bomb", {
      init: function() {
        var that = this;
        this.burned=false;
        setTimeout(function(){ that.timer()}, 0);
      },
      timer : function() {
        this.explosionClock = this.timeout(function () {
          if(!this.burned)
          this.explode();
        }, this.time);
      },
      explode: function() {
        clearTimeout(this.explosionClock);
        this.burned = true;
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
        this.bind("EnterFrame", function(){
          var hitBomber = this.hit("Bomberman");
          if(hitBomber) {
            hitBomber[0].obj.die();
          }
        });
      },
      timer : function() {
        if(this.life>0) this.grow();
        this.world.registerFlame(this);
      },
      grow: function(){
        for(i=0;i<this.growTo.length;i++) {
          var gTo = this.growTo[i];
            if(!this.world.blocks('flame', {
                 x:this.x+gTo.x*Config.BLOCK_SIZE,
                 y: this.y+gTo.y*Config.BLOCK_SIZE})) {

                  var _flameSprite = ((this.life==1)?"flameleafsprite":"flamesprite");

                  if(gTo.x < 0) _flameSprite += "_left";
                  else if(gTo.x > 0) _flameSprite += "_right";
                  else if(gTo.y < 0) _flameSprite += "_up";
                  else if(gTo.y > 0) _flameSprite += "_down";

              Crafty.e("Flame, 2D, Canvas, "+_flameSprite+", Collision")
              .attr({
                  x:this.x+gTo.x*Config.BLOCK_SIZE,
                  y:this.y+gTo.y*Config.BLOCK_SIZE,
                  name:this.name,
                  time:this.time,
                  world:this.world,
                  growTo:[gTo],
                  life:this.life-1
              })
              .collision()//new Crafty.polygon([0,0],[30,0],[30,30],[0,30]))
              ;
           }
        }
      }
  });
});
