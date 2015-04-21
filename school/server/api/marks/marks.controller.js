
'use strict';

var _ = require('lodash');
var User = require('../user/user.model');
var Marks = require('./marks.model');
var School = require('../school/school.model');
// Get list of markss
exports.index = function(req, res) {
  Marks.find(function (err, markss) {
    if(err) { return handleError(res, err); }
    return res.json(200, markss);
  });
};

// Get a single marks
exports.show = function(req, res) {
  Marks.findById(req.params.id, function (err, marks) {
    if(err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    return res.json(marks);
  });
};

// Get a single mark
exports.getMark = function(req, res) {
  var params = req.params;
  console.log("requested", req.params);
  if(req.params.typeofexam == "all") {
    delete params.typeofexam;
  }
  if(req.params.studentid == "all") {
    delete params.studentid;
  }
  console.log("request", params);
  Marks.find(params, function (err, marks) {
    if(err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    return res.json(marks);
  });
};

// Get a single mark
exports.getAllMarks = function(req, res) {
  Marks.find({typeofexam: req.params.typeofexam}, function (err, marks) {
    if(err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    return res.json(marks);
  });
};

// Creates a new marks in the DB.
exports.create = function(req, res) {
  console.log("requested", req.body);
  School.findOne({school: req.body.school}, function (err, school) {
    if (err) return next(err);
    if (!school) return res.send(401);
    var d = new Date();
    delete req.body.serverUpdate;
    console.log("before store:", req.body);
    Marks.create(req.body, function(err, marks) {
      if(err) { return handleError(res, err); }
      return res.json(201, marks);
    });
  });
};

// Updates an existing marks in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
    console.log("requested", req.body);
    School.findOne({school: req.body.school}, function (err, school) {
    if (err) return next(err);
    if (!school) return res.send(401);
    var total = 0;
    var status = "Pass";
    req.body.marks.forEach(function(v) {
      console.log("v:", req.body.marks[v]);
      console.log("v1:", parseInt(req.body.marks[v]));
      if(req.body.marks[v] < school.passmark) {
        status = "Fail";
      }
      total = parseInt(total) + parseInt(req.body.marks[v]);
    });    
    req.body.total = total;
    req.body.percentage = total * (100/(req.body.subjects.length*100));
    school.grades.forEach(function(v) {
      if((req.body.percentage >= v.lesser) && ((req.body.percentage <= v.greater))) {
        req.body.grade = (status == "Fail") ? "Grade F" : v.grade;
      }
    })
    req.body.status = status;
    Marks.findById(req.params.id, function (err, marks) {
      if (err) { return handleError(res, err); }
      if(!marks) { return res.send(404); }
      var updated = _.merge(marks, req.body);
      updated.save(function (err) {
        if (err) { return handleError(res, err); }
        return res.json(200, marks);
      });
    });
  });
};

// Deletes a marks from the DB.
exports.destroy = function(req, res) {
  Marks.findById(req.params.id, function (err, marks) {
    if(err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    marks.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}