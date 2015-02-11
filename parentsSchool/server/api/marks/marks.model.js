'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MarksSchema = new Schema({
  student: String,
  school: String,
  type: String,
  tamil: Number,
  english: Number,
  hindi: Number,
  french: Number,
  math: Number,
  physics: Number,
  chemistry: Number,
  botany: Number,
  zoology: Number,
  social: Number,
  commerce: Number,
  civil: Number,
  accountancy: Number,
  total: Number,
  created: Date,
  updated: Date
});

module.exports = mongoose.model('Marks', MarksSchema);