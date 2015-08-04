//Dependencies
var express = require('express');
var ejs = require('ejs');
var sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var session = require('express-session');



//Passport

var LocalStrategy = require('passport-local').Strategy;

//Start express and bind it to app.
var app = express();

//Database
var dbFile = './db/db.sqlite';
var db = new sqlite3.Database(dbFile);

//Middleware
app.set('view engine' , 'ejs');
app.use(session({secret: 'secret token', resave: true, saveUninitialized: true}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cookieParser('super secret token'));
app.use(passport.initialize());
app.use(passport.session()); //Q: User not defined when session handler is trying to be used


//Let's define what our local passport strategy is
passport.use(new LocalStrategy(
  function (username, password, done) {

    db.get('SELECT * FROM users WHERE username = ?', username, function (err, user) { //In this case, the "row" is being passed back as user
      //Q: Even if the user is not found, sqlite3 will only ever return null for an error status. Why is this?         

      if (err) { return done(err); } //Error case, where database fails. Immediately get out of this.
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' }); //Q: I don't know where this message is bounded. How do I even pass this to my end user?
      } //Error case, where user doesn't exist
      if (!user.password || user.password != password) {
        return done(null, false, { message: 'Incorrect password.' }); //Q: I don't know where this message is bounded. How do I even pass this to my end user?
      } //Error case. The user exists, but this isn't the right password.
      return done(null, user); //All is well, return our user.

    });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user);
}); 
 
passport.deserializeUser(function (user, done) {
  done(null, user);
});


//Requests all go to views by default
app.use(express.static(__dirname + '/views'));


//Routes
  //Index
app.get('/', function (req,res) {
  res.render('index', {authStatus: ''});
});

  //Login
app.get('/login', function (req,res) {

  if( req.user !== undefined) {
    res.redirect('/myProfile');
  }

  res.render('login', {authStatus: ''});
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/loginSuccess',
    failureRedirect: '/loginFailure'
  })
);

app.get('/logout', function(req, res){
  req.logout();
  res.render('index', {authStatus: 'Logged out successfully'});
});

app.get('/loginFailure', function (req, res, next) {
  res.render('login', { authStatus: 'Failed to authenticate' });
});
 
app.get('/loginSuccess', function (req, res, next) {
  console.log(req.user);

  res.render('index', { authStatus: 'Successfully authenticated'});
});

  //Profile
app.get('/myProfile', function (req, res) {
  var user = req.user;

  if(user === undefined) {
    res.redirect('/login');
  }

  res.render('user', {user: user});
});  

//Listen at port
app.listen(3000);