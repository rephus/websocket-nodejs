$("#reconnect").click(function(){
  localStorage.removeItem('connectionId');
  connect();
});

function log(text){
  console.log(text);
  $("#log").append(text+"\n");
}
