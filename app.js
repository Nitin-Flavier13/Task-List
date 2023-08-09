//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todoListDB",{useNewUrlParser: true})
.then(()=>console.log("Successful Connection"))
.catch((err)=>console.log(err));

const toDoSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [toDoSchema],
});

const Item = mongoose.model("item",toDoSchema);
const List = mongoose.model("List",listSchema);

// const list_val= new List({
//   name: "Day after",
//   items: [],
// });
// list_val.items.push({name:"ok i am"});
// list_val.save();

// Item.insertMany([item1,item2]).then(()=>console.log("Succesful here"))
// .catch((err)=>console.log(err));

app.get("/", function(req, res) {

  const day = date.getDate();
  const store=[];

  Item.find({}).then((data)=>{
    console.log("successful retreive ");
    data.forEach((ele)=>{
      store.push(ele.name);
    });
    res.render("list", {listTitle: day, newListItems: store});   // do not keep it outside as it is asynchronous
  }).catch((err)=>console.log(err));

});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const type = req.body.list;
  const day = date.getDate();
  console.log(req.body);
  console.log(type);

  if(type == day){
    Item.exists({name: item}).then((flag)=>{
      if(!flag){
        const item_new = new Item({
          name: item,
        });
        item_new.save();
      }
      res.redirect("/");
    }).catch((err)=>console.log(err));
  }
  else{
    List.findOne({name: type}).then((data)=>{
      data.items.push({name: item});
      data.save();
      res.redirect("/"+type);
    }).catch((err)=>console.log("Error in / " + err));
  }
  
});

app.post("/delete",(req,res)=>{
  const body = req.body.check;
  const day = date.getDate();
  const array = body.split(',');
  const item_name = array[0];
  let page_name = array[1];

  if(array.length == 3)
    page_name += ","+array[2]; 

  console.log(page_name);
  if(page_name == day){
    Item.deleteOne({name: item_name,})
    .then(()=>console.log("Main Page Item deletion Done !"))
    .catch((err)=>console.log("Error in /delete " + err));
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name: page_name},{$pull: {items: {name: item_name}}})
    .then((data)=>{
      console.log("Done Succesfully");
    }).catch((err)=>console.log("Error in /delete " + err));
    res.redirect("/"+page_name);
  }
});

app.get("/work", function(req,res){
  console.log("entered");
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/:topic",(req,res)=>{
  const page = req.params.topic;

  List.exists({name: page}).then((flag)=>{
    if(!flag)
    {
      const list = new List({
        name: page,
        items: [],
      });
      list.save();
      res.render("list.ejs",{listTitle: page,newListItems: list.items});
    }
    else
    {
      List.find({}).then((data)=>{
        data.forEach((ele)=>{
          if(ele.name == page)
          {
            let item_store = [];
            ele.items.forEach((point)=>{
              item_store.push(point.name);
            });
            
            res.render("list.ejs",{listTitle: page,newListItems: item_store});
          }
        });
      }).catch((err)=>console.log("/:topic already exists: " + err));
    }

  }).catch((err)=>console.log("Error at /:topic " + err));
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
