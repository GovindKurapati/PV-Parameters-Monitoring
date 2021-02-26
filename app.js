const express = require('express');
const app = express();
const mongoose = require('mongoose');

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

app.get('/',async(req,res)=>{
    res.render("home");
})

let weather ; 
let uv;
app.get('/pv',async(req,res)=>{



    const params = await Paramters.find({});
    await getWeather();

    let today = weather.dt;
    var date = new Date(today * 1000);
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var query = day+"-0"+month+"-"+year;
    var mindaydate = day-4;
    var mindayquery = day - 5 + "-0" + month + "-" +year;
    
    let last5daysdata = []
    for(let i=1;i<=5;i++){
        const dateparams = await Paramters.find({date:mindayquery})
        mindayquery =  mindaydate+i+"-0"+month+"-"+year;
        last5daysdata.push(dateparams)
    }
    res.render("paramters/index",{params,weather,uv,last5daysdata});
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

    // axios.get('http://api.openweathermap.org/data/2.5/weather?q=Chennai&appid=97ac0499824fa966947163899745f784')
    //     .then(response => {
    //         // let weather =JSON.parse(response);
    //         //console.log(response);
    //         weather = response.json();
         
    //     })
    //     .catch(error => {
    //         console.log(error);
    //     });
}