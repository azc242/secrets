//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt  = require("bcrypt");
const saltRounds = 10;
// const md5 = require('md5');
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const secret = "thisIsMySecret";

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    if(!err){
      newUser = new User({
        email: req.body.username,
        password: hash
      });
      newUser.save();
      res.render("secrets");
    }
  });
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {

  User.findOne({email: req.body.username}, function(err, foundUser) {
    if(!err){

      bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
        if(result === true){
          res.render("secrets");
        } else {
          res.send("Error: incorrect combination of username and password");
        }
      });
    }
  });
});


app.listen(3000, function(){
  console.log("Server started on port 3000");
});
