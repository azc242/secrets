//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const RedditStrategy = require('passport-reddit').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.APP_SECRET,
  resave: false,
  saveUninitialized: false
}));

// set up passport to handle login sessions/cookies
app.use(passport.initialize());
app.use(passport.session());

// set up MongoDB Atlas cloud database
mongoose.connect("mongodb+srv://alanAdmin:" + process.env.ATLAS_PASSWORD + "@cluster0-p9rby.mongodb.net/userDB?retryWrites=true&w=majority", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
mongoose.set('useCreateIndex', true);

// Create schema for users
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    sparse: true,
    unique: true
  },
  password: String,
  googleId: String,
  facebookId: String,
  redditId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


// serialize and deseralize for "creating: and "crumbling" cookies
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Set up Google OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.G_CLIENT_ID,
    clientSecret: process.env.G_CLIENT_SECRET,
    callbackURL: "https://secrets-confessions.herokuapp.com/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Set up Facebook OAuth 2.0
passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: "https://secrets-confessions.herokuapp.com/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Setup Reddit OAtuh 2.0
passport.use(new RedditStrategy({
    clientID: process.env.REDDIT_CONSUMER_KEY,
    clientSecret: process.env.REDDIT_CONSUMER_SECRET,
    callbackURL: "https://secrets-confessions.herokuapp.com/auth/reddit/secrets"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ redditId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {

  // if successful registration, redirect to secrets display page
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err) {
      console.log(err);
    }
    passport.authenticate("local", { failureRedirect: '/login' })(req, res, function() {
      // successful login
      res.redirect("/secrets");
    });
  });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }
));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get('/auth/reddit', function(req, res, next){
  passport.authenticate('reddit', {
    state: "false",
  })(req, res, next);
});

app.get('/auth/reddit/secrets',
  passport.authenticate('reddit', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/login");
});

app.get("/secrets", function(req, res) {
  if(req.isAuthenticated()){
    User.find({"secret": {$ne: null}}, function(err, foundUsers) {
      if(err) {
        console.log(err);
        res.redirect("/login");
      } else {
        if(foundUsers) {
          // user found, check if they already have a secret or not
          let hasSecret = false;
          if(req.user.secret) {
            hasSecret = true;
          } else {
            hasSecret = false;
          }
          res.render("secrets", {usersWithSecrets: foundUsers, hasSecret: hasSecret});
        }
      }
    });
  } else {
    res.render("login");
  }
});

app.get("/submit", function(req, res) {
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
    res.render("login");
  }
});

app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function(err, foundUser) {
    if(err){
      console.log(err);
    } else {
      // check if they are registered and logged in
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save();
        res.redirect("/secrets");
      } else {
        res.redirect("/login");
      }
    }
  });
});

app.get("/delete", function(req, res) {
  // preliminary check to see if they are logged in before allowing deletion
  if(req.isAuthenticated()){
    req.user.secret = undefined;
    req.user.save();
    res.redirect("/secrets");
  } else {
    res.render("login");
  }
});

let port = process.env.PORT;
if(port == null || port == "") {
	port = 3000;
}
app.listen(port, function() {
	console.log("Server started successfully");
});
