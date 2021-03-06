var express = require('express');
var socket = require('socket.io');
// App setup
var app = express();
var server = app.listen(8080, function(){
    console.log('listening for requests on port 8080,');
});

// Static files
app.use(express.static('public'));

// Socket setup & pass server
const io = socket(server);
var clients = 0;
const maxGamePlayers = 5;
var ids = [];
var users = [];
var startingUserNumber = 0; 
var rounds = 0;
const maxrounds = 2;
var points = [0, 0, 0, 0, 0];
var gamestate = true;
const images = [
'cash.jpg', 
'diddy.jpg', 
'draymond.jpeg', 
'guy.gif', 
'jack.png', 
'kellyanne.jpg', 
'lebron.jpg', 
'meryl.jpg', 
'nick.png', 
'oh.jpg', 
'roll.jpg', 
'salt.jpg', 
'shaq.jpg', 
'spongebob.jpg', 
'steph.jpg', 
'trump.jpg'
];
const buzzwords = [
    'fam',
    'boneless',
    'hotdog',
    'Trump',
    'Hillary',
    'cracking open a cold one',
    'sick',
    'Drinking away alcoholism',
    'Autocorrect',
    'Every car is self driving',
    'F5 is so refreshing',
    'fidget spinner',
    "Andy's coming",
    'The floor is lava',
    'And thats the wayyyyyyyy the news goes',
    'He protec, he attac, ',
    "Perfect --- don't exist---",
    'aw yeah Mr. Krabs',
    "Yeah it's actually Supreme",
    "CrossFit",
    "Vegan",
    "T R I G G E R E D",
    "I hacked the mainframe",
    "I cracked the system",
    "Illumanati Confirmed",
    "Did someone say...",
    "one liek = 1 ",
];


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/rules.html');
});


io.on('connection', function(socket) {


    console.log('made socket connection', socket.id);
    clients++;
    io.sockets.emit('displayClientNumber', clients);
    
    //On init button
    socket.on('initialize', function() {
        ids = []; //Clear Previous IDs
        users = []; //Clear Previous Usernames
        points = [0, 0, 0, 0, 0]; //Clear Previous Points
        gamestate = true; //Clear previous game
        io.sockets.emit('getID'); //Ask for socket.ids
        io.sockets.emit('getUsername');
    });
    
    //Retrieve IDs 
    socket.on('userID', function(data) {
        //Push data into 'ids' array
        ids.push(data);
        console.log('ID retrieved');
    });
    
    //Retrieve Usernames 
    socket.on('username', function(data) {
        //Push data into 'ids' array
        users.push(data);
        console.log('Username ' + data + ' retrieved');
    });
    
    function chatbasic(message) {
        io.emit('chat', message);
    }
    
    function notifyUsers(ids, leaderIndex, event, messagetospread) {
        for (var i = 0; i < ids.length; i++) {
            if(ids[i] == ids[leaderIndex]) {
                
            } else {
                io.to(ids[i]).emit(event, messagetospread );
            }
        }
    }

    function sendRandomImage() {
        io.emit('newImage', 
            images[Math.floor(Math.random() * images.length)]
        );
    }

    function randomBuzzword() {
        return buzzwords[Math.floor(Math.random() * buzzwords.length)]
    }
    
    socket.on('start', function() {
        if(ids.length >= maxGamePlayers) {
            io.emit('user', 'The maximum amount of users that can be in one game is ' + maxGamePlayers + '. Please disconnect some users' );
        } else {
            startingUserNumber = 0; 
            rounds = 1;
            io.emit('newCaptions');
            chatbasic( users.toString() + ' have joined' );
            chatbasic('Starting game with user ' + users[startingUserNumber]);
            chatbasic('Round ' + rounds);
            io.to(ids[startingUserNumber]).emit('leader', { message: 'You are the leader' });
            notifyUsers(ids, startingUserNumber, 'user', 'You are an user for this round');
            io.to(ids[0]).emit('toggleCaptionSubmit', true);
            sendRandomImage();
            notifyUsers(ids, startingUserNumber, 'suggest', 
                '<ul>' + 
                    '<li>' + randomBuzzword() + '</li><br>' + 
                    '<li>' + randomBuzzword() + '</li><br>' + 
                    '<li>' + randomBuzzword() + '</li><br>' + 
                    '<li>' + randomBuzzword() + '</li><br>' + 
                '</ul>'
            );
        }
    });
    
    function indexOfMax (arr) {
        if (arr.length === 0) {
            return -1;
        }
    
        var max = arr[0];
        var maxIndex = 0;
    
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                maxIndex = i;
                max = arr[i];
            }
        }
    
        return maxIndex;
    }

    socket.on('nextLeader', function(data){
        
        chatbasic(users[startingUserNumber] + ' has chosen ' + data.userIndex + "'s caption!"); 
        
        // Game rounds and ending
        startingUserNumber++;
        if(startingUserNumber >= ids.length) {
            if (rounds >= maxrounds) {
                //Display Winner
                for(var i = 0; i < ids.length; i++) { //Look though all ids and...
                    if (i == indexOfMax(points)) { //If their index matches the maximum point's index
                        console.log('Winner Selected!')
                        io.sockets.emit('user', users[i] + ' is the winner of Supertitle Game Over!'); //Then they are the winner!
                    }
                }
                //Display Gameover
                gamestate = false;
                console.log('Game Over');
            } 
            startingUserNumber = 0;
            rounds++;
            chatbasic('Round ' + rounds);
        }
        
        points[data.userIndex]++;
        console.log(points);
        
        // Next User
        if(gamestate !== false) {
            io.emit('newCaptions');
            chatbasic('Leader is now : ' + users[startingUserNumber]);
            io.to(ids[startingUserNumber]).emit('leader', { 
                message: 'You are the leader', 
            });
            sendRandomImage();
            notifyUsers(ids, startingUserNumber, 'suggest', 
                '<ul>' + 
                    '<li>' + randomBuzzword() + '</li><br>' + 
                    '<li>' + randomBuzzword() + '</li><br>' + 
                    '<li>' + randomBuzzword() + '</li><br>' + 
                    '<li>' + randomBuzzword() + '</li><br>' + 
                '</ul>'
            );
            notifyUsers(ids, startingUserNumber, 'user', 'You are an user for this round');
            notifyUsers(ids, startingUserNumber, 'toggleCaptionSubmit', false);
        }
    });

    socket.on('captionsubmit', function(data) {
       io.to(ids[startingUserNumber]).emit('captions', 
          '<button class="caption" id="' + ids.indexOf(data.user) + '" onclick="leaderSelection(this.id)">' + data.caption + '</button>'
       ); 
       notifyUsers(ids, startingUserNumber, 'captions', '<span class="usercaption">' + data.caption + '</span>' ); 
       io.to(socket.id).emit('toggleCaptionSubmit', true);
    });
    
    socket.on('chatsanitizer', function(data) {
        var username = users[ids.indexOf(data.id)];
        if(username === undefined) {
            username = 'Anonymous';
        }
        if(!data.message == "") {
            io.emit('chat', username + ': ' + data.message);
        }
    });
    
    socket.on('clear', function(data) {
        io.emit('user', 'A user has disconnected everyone becuase they made a mistake. Please refresh the page');
        Object.keys(io.sockets.sockets).forEach(function(s) {
          io.sockets.sockets[s].disconnect(true);
        });
    });
    
    socket.on('disconnect', function(){
        clients--;
        io.sockets.emit('displayClientNumber', clients);
        console.log('lost connection to ' + socket.id);
    });
});


//\\3. CREATE Prevent users from making multiple captions | Client-side filter
//4. CREATE Add sanitization all inputs and limits to length
//\\6. CREATE Add username
//\\7. CREATE Prevent users from interacting after game ended | #3 did that
//8. CREATE Show users that have and havent sent their captions
//\\9. MAYBE  Chat? FINISH THIS | Slight grammatical fixes can be made
//10 CREATE gui
//11.CREATE Namespaces and rooms
//12.CREATE Instruction/Landing Page
//13.MAYBE  Moderators and Admin? 
//14.REVISE Revise code and make keywords more descriptive
