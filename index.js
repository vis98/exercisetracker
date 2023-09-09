const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser=require('body-parser')
const mongoose=require('mongoose')

app.use(cors())
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema=mongoose.Schema({
  username:{
    type:String,
    unique:true,
  },
},{versionKey:false})

const ExerciseSchema=mongoose.Schema({
  user_id:{type:String,required:true},
  description:String,
  duration:Number,
  date:Date
})

const Exercise=mongoose.model('exercise',ExerciseSchema);
const User=mongoose.model('User',userSchema);

app.use(bodyParser.json());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users",async(req,res)=>{
  const users=await User.find();
  console.log("users",users);
  res.send(users);
})

app.post("/api/users",async (req,res)=>{
 const username=req.body.username;
 const foundUser=await User.findOne({username});
 if(foundUser){
  res.json(foundUser)
 } 
 const user=await User.create({username,});
 res.json(user);

})

app.post("/api/users/:_id/exercises",async (req,res)=>{
  const id=req.params._id;
  console.log("id",id)
  const {description,duration,date}=req.body;
  try{
    const user=await User.findById(id);
    console.log("user",user)
    if(!user){
      res.send("Could not find user");
      
    }
    else{
      const exerciseObj=new Exercise({
        user_id:user.id,
        description,
        duration,
        date:date? new Date(date): new Date()
      })
      console.log("Exercise obj",exerciseObj)
      const exercise=await exerciseObj.save()
      console.log("Exercise obj saved",exercise)
/*       user.description=exercise.description;
      user.duration=exercise.duration;
      user.date=exercise.date.toDateString()
 */      res.send({
  _id:user.id,
  username:user.username,
  description:exercise.description,
  duration:exercise.duration,
  date:exercise.date.toDateString()
 })
    }
  }
  catch(err){
    console.log("Err",err)
    res.send("error in saving exercise obj");

  }
  
 
 })

 app.get("/api/users/:_id/logs",async (req,res)=>{
  const {from,to,limit}=req.query;
  const id=req.params._id;
  
  const user=await User.findById(id);

  
  try{
    const user=await User.findById(id);
    console.log("user",user)
    if(!user){
      res.send("Could not find user");
      return;
    }
    else{
      let dateObj={}
      if(from){
        dateObj["$gte"]=new Date(from)//.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
      }
      if(to){
        dateObj["$lte"]=new Date(to)//.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
      }

      let filter={
        user_id:id
      }
      if(from || to){
        filter.date=dateObj;

      }
      console.log("Fitler",filter)
      const exercises=await Exercise.find(filter).limit(+limit ?? 500);
      const log=exercises.map(e=>({
        description:e.description,
        duration: e.duration,
        date:  e.date.toDateString()
      }))
      res.json({
        username:user.user,
        count:exercises.length,
        _id:user._id,
        log:log
      })
    }
  }
  catch(err){
    res.send("error in getting exercise obj");

  }
  
 
 })




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
