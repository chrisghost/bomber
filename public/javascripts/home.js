$(function(){
  if(typeof localStorage.pname != "undefined")
    $("#join-game input[name=userId]").val(localStorage.pname);
  $("#join-game").submit(function(e){
    e.preventDefault();
    var _pname = $("#join-game input[name=userId]").val();
    var _gname = $("#join-game input[name=gameName]").val();

    if (_gname == "") $("#join-game #gameNameHolder").addClass("error");
    if (_pname == "") $("#join-game #playerNameHolder").addClass("error");

    if (_pname != "" && _gname != "") {
      localStorage.pname=_pname;
      document.location="/bomber/"+_gname+"/"+_pname;
    }
  });
})
