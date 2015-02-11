'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GeneralSchema = new Schema({
  school: String,
  subjects: Array,
  typeOfExams: Array,
  created: Date
});

module.exports = mongoose.model('General', GeneralSchema);