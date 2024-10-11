'use strict';
require('dotenv').config();
const express = require('express');

///////////////////////


///////////////////////////////
const myDB = require('./connection');
//const { ObjectID } = require('mongodb');

const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();
const path = require('path');

const auth = require('./auth')
const routes = require('./routes')
const http = require('http').createServer(app);
const io = require('socket.io')(http);

///handling sessions
const session = require('express-session');
const passport = require('passport');


//passport in sockect io//////////////////////////////////
const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

//////////////////////////////////////////////////////////////////////////////////

app.set('view engine', 'pug')

// Set the views directory to './views/pug'
app.set('views', './views/pug');



fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//session config
app.use(session({
  secret: process.env.SESSION_SECRET,
  key: 'express.sid',
  store: store,
  resave: true,              
  saveUninitialized: true,   
  cookie: { secure: false }    
}));

///////////////////////////
app.use(passport.initialize())
app.use(passport.session())

  //////////////////////////////////////
  io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);
  ////////////////////////////////




myDB(async client => {
  const myDataBase = await client.db('usersData').collection('users');

  if (myDataBase) {
    console.log("good")
  } else {
    console.log("bad")
  }
  



 

  /// user count
  let currentUsers = 0;
/////////socket listner for connections/////////// 
  io.on('connection', socket => {
  console.log('A user has connected');
  ++currentUsers;
  console.log('user ' + socket.request.user.username + ' connected');

  //io.emit('user count', currentUsers);

  io.emit('user', {
  username: socket.request.user.username,
  currentUsers,
  connected: true
  });

   // sending message from a user to all users in a socket
  socket.on('chat message', (message) => {
      io.emit('chat message', { username: socket.request.user.username, message });
    });

  //disconnect
  socket.on('disconnect', () => {
  /*anything you want to do on disconnect*/
  console.log('A user has disconnected');
  --currentUsers;

  // Emit the updated user count to all clients
    io.emit('user count', currentUsers);

});


});


auth(app, myDataBase) //authenticate
routes(app, myDataBase) // routes


/////////////////////////////////////
app.use((req, res, next) => {
  res.status(404) 
    .type('text')
    .send('Not Found');
});
///////////////////////////// handling 404 error



  // Be sure to add this...
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});


//////////////////////callback func for sockect io authentication
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}
//////////////////////////////////////////


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
