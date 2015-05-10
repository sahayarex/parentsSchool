
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
  if(req.params.typeofexam.toLowerCase() == "all") {
    delete params.typeofexam;
  }
  if(req.params.studentid.toLowerCase() == "all") {
    delete params.studentid;
  }
  if((req.params.standard == 'undefined') || (req.params.standard == 'all')) {
    delete params.standard;
  }
  if((req.params.typeofexam == 'undefined') || (req.params.typeofexam == 'all')) {
    delete params.typeofexam;
  }  
  if((req.params.division == 'undefined') || (req.params.division.toLowerCase() == "all")) {
    delete params.division;
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
/*{ school: 'school a',
  schoolid: '553b23937d39d2851f8949c3',
  student: 'Student b',
  studentid: '2',
  standard: '8',
  division: 'a',
  typeofexam: 'Quaterly',
  tamil: '10',
  english: '20',
  hindi: 'ab',
  math: '20',
  science: '10',
  history: '20',
  attendance: '10/30',
  import: true }*/
// Creates a new marks in the DB.
exports.create = function(req, res) {
  if(req.body.import) {
    User.findOne({schoolid: req.body.schoolid, name: req.body.student, studentid: req.body.studentid, role: "student"}, function (err, student) {
      if (err) return next(err);
      if (!student) return res.send(401);
      var total = 0;
      var status = "Pass";
      var studentMark = req.body;
      studentMark.marks = [];
      student.subjects.forEach(function(sub, si) {
        studentMark.marks[si] = {};
        if(studentMark[sub] == "ab") {
          studentMark.marks[si]["status"] = "absent";
          studentMark.marks[si][sub] = 0;
          status = "Fail";
        } else {
          studentMark.marks[si]["status"] = "present";
          studentMark.marks[si][sub] = parseInt(studentMark[sub]);
        }
        total = parseInt(total) + studentMark.marks[si][sub];
        if(studentMark[sub] < studentMark.passmark) {
          status = "Fail";
        }
      })
      studentMark.studentid = student._id;
      studentMark.typeofexam = studentMark.typeofexam.toLowerCase();
      studentMark.subjects = student.subjects;
      studentMark.status = status;
      studentMark.total = total;
      studentMark.percentage = (total * (100/(student.subjects.length*100))).toPrecision(4);
      studentMark.grades.forEach(function(gv, gk) {
        if((studentMark.percentage >= gv.lesser) && ((studentMark.percentage <= gv.greater))) {
          studentMark.grade = (status == "Fail") ? "Grade F" : gv.grade;
        }
      })
      if(studentMark.attendance) {
        var attendanceVal = studentMark.attendance.split("/");
        studentMark.attendanceP = (parseInt(attendanceVal[0]) * (100/parseInt(attendanceVal[1]))).toPrecision(4);
      }
      console.log("before store:", studentMark);
      Marks.findOne({studentid: student._id, typeofexam: studentMark.typeofexam, educationyear: studentMark.educationyear}, function(err, markcreated) {
        if (err) return next(err);
        var t = new Date();
        if(markcreated) {
          console.log("mark exists so updating the mark");
        } else {
          console.log("Create new mark");
        }
        if(markcreated) {
          var updated = _.merge(markcreated, studentMark);
          studentMark.updated = t.getTime();
          updated.save(function (err) {
          if (err) { return handleError(res, err); }
            return res.json(200, markcreated);
          });
        } else {
          studentMark.created = studentMark.updated = t.getTime();
          Marks.create(studentMark, function(err, marks) {
            if(err) { return handleError(res, err); }
            return res.json(201, marks);
          });
        }
      })
    });
  } else {
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
  }
};

// Updates an existing marks in the DB.
exports.update = function(req, res) {
  if(req.body.import) {
    Marks.findById(req.params.id, function (err, marks) {
      if (err) { return handleError(res, err); }
      if(!marks) { return res.send(404); }
      var updated = _.merge(marks, req.body);
      updated.save(function (err) {
        if (err) { return handleError(res, err); }
        return res.json(200, marks);
      });
    });
  } else {
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
  }
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