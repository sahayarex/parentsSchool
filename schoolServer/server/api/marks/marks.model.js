'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MarksSchema = new Schema({
  student: String,
  studentid: String,
  school: String,
  schoolid: String,
  typeofexam: String,
  marks: Array,
  total: {type: Number, default: 0},
  percentage: {type: Number, default: 0},
  rank: {type: Number, default: 0},
  grade: String,
  attendance: String,
  attendanceP: Number,
  status: String,
  year: Number,
  educationyear: String,
  subjects: Array,
  teacher: String,
  teacherid: String,
  standard: String,
  division: String,
  remarks: String,
  created: Date,
  updated: Date
});


module.exports = mongoose.model('Marks', MarksSchema);