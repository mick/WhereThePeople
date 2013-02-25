var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

var fetch_petition = require("./data/fetch.js");
var map = require("./data/genMap.js");

// 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var sockjs_echo = sockjs.createServer(sockjs_opts);
sockjs_echo.on('connection', function(conn) {
    conn.on('data', function(message) {
      message = JSON.parse(message);
      console.log(message);
      if(message.action == "fetch"){
        fetch_petition.getPetitionWithSignatures(message.petitionId, function(status){
          if(status.status == "done"){
            map.genMap(status.signatures, status.petition.id, function(s){
              console.log("day", s);
              delete status["signatures"];
              status.dayCount = s.dayCount;
              status.maxVal = s.maxVal;
              console.log("final status:", status);
              conn.write(JSON.stringify(status));              
            });
          }else{
            conn.write(JSON.stringify(status));
          }

        })
      }
    });
});

// 2. Static files server
var static_directory = new node_static.Server(__dirname);

// 3. Usual http stuff
var server = http.createServer();
server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
});
server.addListener('upgrade', function(req,res){
    res.end();
});

sockjs_echo.installHandlers(server, {prefix:'/echo'});

console.log("started on port: ", process.env.PORT || 9999);
server.listen(process.env.PORT || 9999, '0.0.0.0');
