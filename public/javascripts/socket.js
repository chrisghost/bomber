$ = jQuery.noConflict();
humane.error = humane.spawn({ addnCls: 'humane-libnotify-error'});

var _socket = {
  init:function(){
    var WSurl = document.location.href.replace("http", "ws")+"ws";

    if(getMyName() != "") WSurl += "?userId="+getMyName();
    if(getGameName() != "") WSurl += "&gameName="+getGameName();

    socket = new WebSocket(WSurl);
    socket.onopen = function(){
      console.log("Socket has been opened!");
    }

    socket.onmessage = function(msg){
      var d = JSON.parse(msg.data);
      //console.log(d);
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
    //console.log(d);
    if(d.kind=="newPlayer")
      createPlayer(d.c);
    else if(d.kind=="newDirection") {
      Crafty.trigger("newDirection"+d.c.userId, d.c);
    }
    else if(d.kind=="position") {
      Crafty.trigger("position"+d.c.userId, d.c);
    }
    else if(d.kind=="deletePlayer") {
      Crafty.trigger("deletePlayer"+d.c.userId);
    }
  }
};


var players = {};
var pname = "",
    gname = "";

function promptForName() {
  var name = prompt("Enter your name");
  setMyName(name);
  return getMyName();
}
function setMyName(name) {
  pname=name;
}
function getMyName() {
  if(pname != "") return pname;
  else return promptForName();
}

function promptForGame() {
  var game = prompt("Enter game name");
  setGameName(game);
  return getGameName();
}
function setGameName(game){
  gname = game;
}
function getGameName() {
  if(gname != "") return gname;
  else return promptForGame();
}

$(function(){
  promptForGame();
  promptForName();
  _socket.init();
})
