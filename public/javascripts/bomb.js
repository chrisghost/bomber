$(function(){
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
});
