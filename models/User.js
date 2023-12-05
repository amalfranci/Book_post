const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  number:{
    type:Number,
    required:true
  }
  ,
  valu:{
    type:String,
    required:true
  }
  
});

module.exports = new mongoose.model("User", UserSchema);
