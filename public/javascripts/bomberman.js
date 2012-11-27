$(function(){
  //start crafty
  Crafty.init(300, 300);
  Crafty.scene("loading", function () {
    //load takes an array of assets and a callback when complete

    //black background with some loading text
    Crafty.background("#000");
    Crafty.e("2D, DOM, Text").attr({ w: 100, h: 20, x: 150, y: 120 })
    .text("Loading")
    .css({ "text-align": "center" });
  });
  //automatically play the loading scene
  Crafty.scene("loading");

  Crafty.sprite(29.5, "assets/images/bomber-white-classic.png", { bomberclassicsprite: [0, 0]});
  Crafty.sprite(29.5, "assets/images/bomber-white-punk.png", { bomberpunksprite: [0, 0]});

  Crafty.c("BombermanWhite", {
      init: function() {
        this.addComponent("2D, Canvas, bomberclassicsprite, Fourway");
        this.fourway(2);

        this.w = 30;    // width
        this.h = 30;    // height

        this.bind("NewDirection", function (e) {
          _socket.sendData("dir", {"newDirection" : {"x":e.x,"y":e.y}});
        });
      }
  });


  Crafty.scene("main", function () {
    //load takes an array of assets and a callback when complete
    var pl = Crafty.e("BombermanWhite")
    .attr({x: 160, y: 96}); // for Component 2D

  });
  Crafty.scene("main");


  function createPlayer(info) {
    Crafty.c("Bomber", {
      init: function() {
        this.addComponent("2D, canvas, bomberpunksprite");
        this.w=30;
        this.h=30;

      }
    });
  }
})
