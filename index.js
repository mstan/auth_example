//Dependencies
var express = require('express');
var ejs = require('ejs');
var sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');
var passport = require('passport');
var cookieParser = require('cookie-parser'); //Q: Do I need this? I don't know.

//Passport

var LocalStrategy = require('passport-local').Strategy;

//Start express and bind it to app.
var app = express();

//Database
var dbFile = './db/db.sqlite';
var db = new sqlite3.Database(dbFile);

//Middleware
app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser()); //Q: Do I need this? I don't know.
app.use(passport.initialize());
app.use(passport.session());

//Let's define what our local passport strategy is
passport.use(new LocalStrategy(
  function (username, password, done) {

    db.get('SELECT * FROM users WHERE username = ?', username, function (err, user) { //In this case, the "row" is being passed back as user
      console.log('passport.use middleware function, return the user: '); // Test to see if user exists.   
      console.log(user);
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
  console.log('user as it is passed through by serializeUser');
  console.log(user);
  done(null, user.id);
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

	res.render('login');
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/loginSuccess',
    failureRedirect: '/loginFailure'
  })
);

app.get('/loginFailure', function (req, res, next) {
  res.render('login', { authStatus: 'Failed to authenticate' });
});
 
app.get('/loginSuccess', function (req, res, next) {
  console.log('loginSuccess, return our user by req.user if it exists: '); 
  console.log(req.user); //Q: This is undefined. Doesn't exist?
  console.log('loginSuccess, return our user by req.cookies if it exists: ');
  console.log (req.cookies); //Q: This returns {}. An empty object? Is it not being populated?
  res.render('index', { authStatus: 'Successfully authenticated'});
});

//Listen at port
app.listen(3000);