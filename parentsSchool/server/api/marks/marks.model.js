'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MarksSchema = new Schema({
  student: String,
  studentid: String,
  school: String,
  type: String,
  sub_tamil: {type: Number, default: 0},
  sub_english: {type: Number, default: 0},
  sub_hindi: {type: Number, default: 0},
  sub_french: {type: Number, default: 0},
  sub_math: {type: Number, default: 0},
  sub_physics: {type: Number, default: 0},
  sub_chemistry: {type: Number, default: 0},
  sub_botany: {type: Number, default: 0},
  sub_zoology: {type: Number, default: 0},
  sub_social: {type: Number, default: 0},
  sub_commerce: {type: Number, default: 0},
  sub_civil: {type: Number, default: 0},
  sub_accountancy: {type: Number, default: 0},
  total: {type: Number, default: 0},
  subjects: Array,
  teacher: String,
  teacherName: String,
  standard: String,
  devision: String,
  created: Date,
  updated: Date
});

module.exports = mongoose.model('Marks', MarksSchema);