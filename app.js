//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "Our Little secret.",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/weBook");

const postSchema = new mongoose.Schema({
  judul: String,
  isbn: String,
  penerbit: String,
  deskripsi: String
});

const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  user: String,
  password: String,
  profile: String,
  address: String
},
  {collections: "users"}
);

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/books", function(req, res){

  Post.find({}, function(err,posts){
    if (req.isAuthenticated()){
      res.render("books", {posts: posts})
    } else {
      res.redirect("/login");
    }
  });
});

app.get("/compose", function(req, res){
  if (req.isAuthenticated()){
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", function(req,res){
    const post = new Post({
      judul: req.body.postJudul,
      isbn: req.body.postIsbn,
      penerbit: req.body.postPenerbit,
      deskripsi: req.body.postDeskripsi
    });

    post.save(function(err){
      if(!err) {
        res.redirect("/books");
      }
    });
});

app.get("/utama", function(req, res){
  if (req.isAuthenticated()){
    res.render("utama");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/register", function(req, res){

  User.register({username: req.body.username, profile: req.body.profile, address: req.body.address}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/utama");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err){
      console.log(err);
    } else {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/utama");
      });
    }
  });

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;

  Post.findByIdAndRemove(checkedItemId, function(err){
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully to Remove the Item.");
      res.redirect("/books");
    }
  });

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
