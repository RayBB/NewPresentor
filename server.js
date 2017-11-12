var express = require('express');
console.log("Starting server");
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));



var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);

let stateData = {};

function newConnection(socket){
    console.log("New connection " + socket.id);
    socket.on('disconnect', function(){
        console.log('user disconnected ' + socket.id);
    });

    //Sends each new connection current state data
    socket.emit('stateData', stateData);
    
    socket.on('drawingComplete', sendDrawing);
    function sendDrawing(data){
        stateData[data[0]] = data[1];
        socket.broadcast.emit('drawThis', data);
    }

}