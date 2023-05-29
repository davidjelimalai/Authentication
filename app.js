require("dotenv").config()
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const ejs=require("ejs");
const express=require("express")
const encrypt= require("mongoose-encryption")
const md5= require("md5")
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/Autentification');

const userSchema= new mongoose.Schema({
    email:String,
    password:String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const user=mongoose.model("User", userSchema)

app.get("/", function(req, res){
    res.render("home")
});

app.get("/login", function(req, res){
    res.render("login")
});

app.get("/register", function(req, res){

    res.render("register")
});

app.post("/register", function(req,res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

        const userName=new user({
            email:req.body.username,
            password:hash
        });
    
        userName.save().then(function(result){
            res.render("secrets");
        })
    });
});

app.post("/login", function(req,res){

    const username=req.body.username;
    const password=req.body.password;

    user.findOne({email:username})
    .then(function(foundUser){
        if(foundUser){
            bcrypt.compare(password, foundUser.password, function(err, result) {
              if(result=== true){
                res.render("secrets")
              }
            }); 
        }else{
            console.log("Erorr password or email");
        } 
    }).catch(function(err){
       
        console.log("Erorr password or email");
    })
});
app.listen(3000, function(){
    console.log("Server started on port 3000");
})
