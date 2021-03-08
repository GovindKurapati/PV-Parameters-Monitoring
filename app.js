const express = require('express');
const app = express();
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var _ = require('underscore');

const path = require('path');
const Paramters = require("./models/parameters")
const axios  = require('axios')
const fetch = require('node-fetch')

app.use( express.static( "public" ) );

mongoose.connect('mongodb://localhost:27017/pvpanel',{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true
});

// mongoose.connect('mongodb+srv://govind:govi@cluster0.pdpxi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{
//     useNewUrlParser:true,
//     useCreateIndex:true,
//     useUnifiedTopology:true
// });

// mongodb+srv://govind:<password>@cluster0.pdpxi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority

const db = mongoose.connection;
db.on("error",console.error.bind(console,"Connection Error: "));
db.once("open",()=>{
    console.log("Database Connected");
}
);

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"))
app.engine('html', require('ejs').renderFile);
app.use(express.static('public'))

var publicDir = require('path').join(__dirname,'/public'); 
app.use(express.static(publicDir));

app.get('/',(req,res)=>{
    res.render("home.html");
})

let weather ; 
let uv;
let performanceMessage = false
app.get('/pv',async(req,res)=>{
  
    await getWeather();

    let today = weather.dt;
    var date = new Date(today * 1000);
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var query = day+"-0"+month+"-"+year;
    var mindaydate = day-5;
    var mindayquery = day - 4 + "-0" + month + "-" +year;
  let last5daysdata = []

     
    for(let i=1;i<=5;i++){
        let finaldate,finalmonth,finalyear;
        if(mindaydate+i<1)
        { 
            if(month-1>0)
            {
                if(month-1==4 || month-1==6 || month-1==9 || month-1==11)finaldate=30+mindate;
                else if(month-1==1 || month-1==3 || month-1==5 || month-1==7|| month-1==8||month-1==10||month-1==12)finaldate=31+mindate;
                else if ((month-1==2) )
                {
                    finaldate=28+mindaydate;
                    if(year%4==0 || year%100==0)
                    {
                        finaldate=29+mindaydate;
                    }
                }
                finalmonth=month-1;
                finalyear=year;
            }
            else
            {
                finaldate=31+mindaydate;
                finalmonth=12;
                finalyear=year-1;
            }
        }
        else
        {
          finaldate=mindaydate;
            finalmonth=month;
            finalyear=year;
        }

        mindayquery =  finaldate+i+"-"+finalmonth+"-"+finalyear;
        const dateparams = await Paramters.find({date:mindayquery})


        // console.log(mindayquery)
        last5daysdata.push(dateparams)
    }

        await performanceCheck(last5daysdata);


    // console.log(last5daysdata);
    let sum = 0

    await Paramters.find({},function(err,data){
      if(err){
        console.log(err);
      }
      else{
        sum = _.reduce(data,function(a,b){return a+parseInt(b.power)},0)
         
      }
    })

    const totalUnits = {
      data:sum
    }    

    res.render("paramters/index",{weather,uv,last5daysdata,totalUnits});
})

app.get("/mail",(req,res)=>{

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kgovindrar@gmail.com',
          pass: 'govind123'
        }
      });
      
      var mailOptions = {
        from: 'kgovindrar@gmail.com',
        to: 'jeevaharan7@gmail.com',
        subject: 'Maintenance Needed !!!',
        text: 'Your PV panel needs maintenance.'
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          res.render("home.html")
        }
      });
})

app.listen(3000,()=>{
    console.log("Server is listening at PORT 3000");
})

async function getWeather(){
    await fetch('http://api.openweathermap.org/data/2.5/weather?q=Chennai&appid=97ac0499824fa966947163899745f784')
  .then(res => res.json())
  .then(data => weather = data)
  .catch(()=>console.log("Error in fetching weather API"))

  await fetch('http://api.openweathermap.org/data/2.5/uvi?lat=13.08&lon=80.27&appid=97ac0499824fa966947163899745f784')
  .then(res => res.json())
  .then(data => uv = data)
  .catch(()=> console.log("Error in fetching UV details"))
}

async function performanceCheck(last5daysdata){
  let data = last5daysdata
  let performanceArray = []
  for(var i=0;i<data.length;i++){
    let perdaypower =0 
    for(var j=0;j<data[i].length;j++)
    {
      perdaypower += parseInt(data[i][j].power)
    }
    performanceArray.push(perdaypower)
  }
    console.log(performanceArray);
    let weatherToday = weather.main.temp - 273.15
  if((performanceArray[4]<performanceArray[3] || performanceArray[4]<performanceArray[2]) && weatherToday>=25 ){
    // performanceMessage.innerHTML = "Your panel needs maintenance"
    performanceMessage = true    
  }else{
    performanceMessage = false
  }
}
