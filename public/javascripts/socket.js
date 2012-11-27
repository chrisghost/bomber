$ = jQuery.noConflict();

var _socket = {
  init:function(){
    socket = new WebSocket("ws://localhost:9000/ws");
    socket.onopen = function(){
      console.log("Socket has been opened!");
    }

    socket.onmessage = function(msg){
      console.log("------------------message received");
      var d = JSON.parse(msg.data);
      if(d.error) {
        console.log("error, closing socket...");
        socket.close();
        humane.log("Socket error", { addnCls: 'humane-error' });
      }
      _socket.handleMessage(d);
    }
  },
  sendMessage : function(msg) {
    var data = JSON.stringify(
        {
          "kind":"talk",
          "text":msg
        }
    );
    console.log(data);
    socket.send(data);
  },
  sendData : function(kind, data) {
    var _data = JSON.stringify({ 
        "kind":kind, "c":JSON.stringify(data) });
    console.log(_data);
    socket.send(_data);
  },
  handleMessage : function(d) {
    console.log(d);
    if(d.kind=="youAre")
      setMyName(d.pid);
    else if(d.kind=="newPlayer")
      createPlayer(d.data);
    else if(d.kind=="talk")
      printMessage(d);
    else if (d.kind=="join" && d.user != getMyName())
      humane.log(d.user+" has joined");
  }
};


var players = {};
var pname = "";
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

var handleReturnKey = function(e) {
  if(e.charCode == 13 || e.keyCode == 13) {
    e.preventDefault();
    _socket.sendMessage($("#talk").val());
    $("#talk").val('')
  }
}

var printMessage = function(msg) {
  console.log(msg);
  var el = $('<div class="message"><span></span><p></p></div>')
  $("span", el).text(msg.user)
  $("p", el).text(msg.data.text)
  $(el).addClass(msg.kind)
  if(msg.user == getMyName()) $(el).addClass('me')
  $('#messages').append(el)
  $("#messages").each( function() {
    var scrollHeight = Math.max(this.scrollHeight, this.clientHeight);
    this.scrollTop = scrollHeight - this.clientHeight;
  });
}

$(function(){
  setMyName(Math.round(Math.random()*1000));
  _socket.init();
  $("#talk").keypress(handleReturnKey)

})
