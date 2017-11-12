let express = require('express');
let app = express();
let server = app.listen(3000);
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
app.use(express.static('public'));

console.log("Starting server");


let socket = require('socket.io');
let io = socket(server);
io.sockets.on('connection', newConnection);

//Stores all drawings for each slide
let stateData = {};

function newConnection(socket){
    console.log("New connection " + socket.id);
    socket.on('disconnect', function(){
        console.log('user disconnected ' + socket.id);
    });

    //Sends each new connection current state data
    socket.emit('stateData', stateData);
    
    //When we recieve a drawing, send it out to everyone
    socket.on('drawingComplete', sendDrawing);
    function sendDrawing(data){
        stateData[data[0]] = data[1];
        socket.broadcast.emit('drawThis', data);
    }

    socket.on('js', (e) => {
        console.log("JS Recieved");
        io.sockets.emit('js', e);
    })

}