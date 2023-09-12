//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongodb://127.0.0.1:27017 

mongoose.connect(process.env.DATABASE);

const itemsSchema = new mongoose.Schema({
  task: String
});

const listSchema = new mongoose.Schema({
  name: String,
  item: [itemsSchema]
});

const Task = mongoose.model('Task',itemsSchema);
const List = mongoose.model("List",listSchema);


const task1 = new Task({
  task: "Hello World!"
});

const task2 = new Task({
  task: "Programming is Cool!"
});

const task3 = new Task({
  task: "AK likes to Code"
}); 

const itemsList = [task1,task2,task3];

app.get("/", function(req, res) {

  //foundItems is the collection/array of docs here
  Task.find()
  .then((foundItems)=>{

    if (foundItems.length === 0 ){
      Task.insertMany(itemsList)
        .then(()=>{
          console.log("Insert Successfull");
        })
        .catch((err)=>{
          console.log(`Error while inserting data into DB ${err}`);
        });

        res.redirect('/');

    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
  .catch((err)=>{
    console.log(`${err} Error`);
  });
});

app.get("/:customListName",(req,res)=>{
  
  const customListName = _.capitalize(req.params.customListName) ;

  List.findOne({name: customListName})
    //foundList is the document satisfying findOne()'s condition
    .then((foundList)=>{
      if (!foundList){

        //Create a new list
        const list = new List({
          name: customListName,
          item: itemsList
        });
        list.save();
        res.redirect("/"+customListName);

      }else{
        //render existing list
        res.render("list", {listTitle: customListName, newListItems: foundList.item});
      }
    })
    .catch((err)=>{
      console.log(err);
    });

});

app.post('/delete',function(req,res){

  const checkedBoxId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    //Delete from Today
    Task.findByIdAndRemove( checkedBoxId )
      .then(()=>{
        res.redirect('/');
      })
      .catch((err)=>{
        console.log(`${err} `);
      });
  }else{
    //Delete from other lists
    List.findOneAndUpdate({name: listName} , {$pull:{item:{_id:checkedBoxId}}})
      .then(()=>{
        res.redirect("/"+listName);
      })
      .catch((err)=>{
        console.log(`${err} `);
      });
  }

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Task({
    task: itemName
  });

  if (listName === "Today"){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
      .then((foundList)=>{
        foundList.item.push(newItem);
        foundList.save();
        res.redirect("/"+listName);
      })
      .catch((err)=>{
        console.log(`${err} `);
      });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log(`Server started on port ${process.env.PORT}`);
});
