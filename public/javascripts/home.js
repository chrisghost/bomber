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
    updateGamesList();
});

function updateGamesList() {
  $.ajax({
    url:"/gamesList",
    success: function(data) {
      var glst = "<ul class='glst'>";
      for (i in data) {
        glst += "<li gid='"+data[i]+"'>"+data[i]+"</li>";
      }
      glst += "</ul>";
      $("#gamesList").html(glst);
      updateGlstItemsCallback();
    },
    error:  function() { humane.error("Failed to retrieve games list"); }
  });
}

function updateGlstItemsCallback() {
  $("ul.glst li").click(function(e){
    $("#join-game input[name=gameName]").val($(this).attr("gid"));
    $("#join-game").submit();
  });
}
