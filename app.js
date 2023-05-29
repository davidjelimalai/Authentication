require("dotenv").config()
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const ejs=require("ejs");
const express=require("express");
const encrypt= require("mongoose-encryption");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate=require("mongoose-findorcreate");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/Autentification');

const secretSchema = new mongoose.Schema({
    secret: String,
   
  });
const Secret = new mongoose.model('Secret', secretSchema)

const userSchema= new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret: [secretSchema]
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const user=mongoose.model("User", userSchema)

passport.use(user.createStrategy());


passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home")
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });


app.get("/login", function(req, res){
    res.render("login")
});

app.get("/register", function(req, res){

    res.render("register")
});

app.get("/secrets", function(req,res){
  user.find({"secret": {$ne:null}})
  .then(function(foundUsers){
    res.render("secrets", {showSecrets: foundUsers})
  }).catch(function(err){
    console.log(err);
  });
});

app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login")
    }
});

app.get("/logout", function(req,res){
    req.logout(function(err) {
        if (err) { return err }
        res.redirect('/');
      });
    });

app.post("/submit", function(req,res){
  const submitedSecret= new Secret({
    secret:req.body.secret
    });
    submitedSecret.save()
  
  user.findById(req.user.id)
  .then(function(foundUser){
    if(foundUser){
        foundUser.secret.push(submitedSecret)
        foundUser.save().then(function(){
            res.redirect("/secrets");
        });
    }
  }).catch(function(err){
    console.log(err);
  });
});

app.post("/register", function(req,res){

    user.register({username:req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req,res, function(){
             res.redirect("/secrets");
            });
        }
    })  
    });
    


app.post("/login", function(req,res){
    const userV=new user({
        username: req.body.username,
        password: req.body.password
    });

    req.login(userV, function(err){

        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
               });
        }
    });
});




app.listen(3000, function(){
    console.log("Server started on port 3000");
})
