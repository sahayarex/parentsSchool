'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SchoolSchema = new Schema({
  school: { type: String, unique: true, required: true},
  grades: Array,
  passmark: Number,
  created: Date,
  updated: Date 
});

module.exports = mongoose.model('School', SchoolSchema);