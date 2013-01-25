$ = jQuery.noConflict();
humane.error = humane.spawn({ addnCls: 'humane-libnotify-error'});

var _socket = {
  init:function(){
    var pageUrl = document.location.toString();
    var WSurl = pageUrl.replace("http://", "ws://")+"/ws";

    socket = new WebSocket(WSurl);
    socket.onopen = function(){
      console.log("Socket has been opened!");
    }

    socket.onmessage = function(msg){
      var d = JSON.parse(msg.data);
      if(d.error) {
        console.log("error, closing socket...", d.error);
        socket.close();
        humane.error("Socket error");
      }
      else
        _socket.handleMessage(d);
    }
    socket.onerror = function(err) {
      console.log("Socket error ",err);
      humane.error("Socket error ",err)
    }
  },
  sendData : function(kind, data) {
    var _data = JSON.stringify({"kind":kind,"data":data});
    socket.send(_data);
  },
  handleMessage : function(d) {
    if(d.kind=="newPlayer")
      createPlayer(d.c);
    else if(d.kind=="readyList") {
      var res = "<ul class=\"readyList\">";
      for(i in d.c.readyList)
        res+="<li class=\""+(d.c.readyList[i].ready ? "ready" : "not-ready")+"\">"+d.c.readyList[i].userId+"</li>";

      res += "</ul>";
      $("#userList").html(res);
    }
    else if(d.kind=="newDirection") {
      Crafty.trigger("newDirection"+d.c.userId, d.c);
    }
    else if(d.kind=="position") {
      Crafty.trigger("position"+d.c.userId, d.c);
    }
    else if(d.kind=="deletePlayer") {
      Crafty.trigger("deletePlayer"+d.c.userId);
    }
    else if(d.kind=="board") {
      Crafty.trigger("board", d.c);
    }
    else if(d.kind=="bomb") {
      Crafty.trigger("dropBomb"+d.c.userId, d.c);
    } else if(d.kind=="death") {
      humane.log((d.c.userId == pname) ? "You died. Game over." : d.c.userId + " has died");
    }
    else if(d.kind=="gotwinner") {
      humane.log((d.c.winner == pname) ? "You won!" : d.c.winner + " won!");
    } else if(d.kind=="destroy") {
      Crafty.trigger("destroy", d.c);
      Crafty.trigger("destroy"+d.c.coord.x+"-"+d.c.coord.y, d.c);
    }
  }
};

var players = {};
var pname = "",
    gname = "";

$(function(){
  _socket.init();
})
