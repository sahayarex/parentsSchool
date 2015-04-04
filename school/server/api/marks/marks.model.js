'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MarksSchema = new Schema({
  student: String,
  studentid: String,
  school: String,
  typeofexam: String,
  tamil: {type: Number, default: 0},
  english: {type: Number, default: 0},
  hindi: {type: Number, default: 0},
  french: {type: Number, default: 0},
  math: {type: Number, default: 0},
  science: {type: Number, default: 0},
  physics: {type: Number, default: 0},
  chemistry: {type: Number, default: 0},
  botany: {type: Number, default: 0},
  zoology: {type: Number, default: 0},
  history: {type: Number, default: 0},
  commerce: {type: Number, default: 0},
  civil: {type: Number, default: 0},
  accountancy: {type: Number, default: 0},
  total: {type: Number, default: 0},
  percentage: {type: Number, default: 0},
  grade: String,
  attendance: String,
  status: String,
  year: Number,
  subjects: Array,
  teacher: String,
  teacherid: String,
  standard: String,
  division: String,
  created: Date,
  updated: Date
});


module.exports = mongoose.model('Marks', MarksSchema);