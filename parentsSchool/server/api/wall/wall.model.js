'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WallSchema = new Schema({
  title: String,
  photo: String,
  message: String,
  likes: Number,
  created: Date,
  author: String,
});

module.exports = mongoose.model('Wall', WallSchema);