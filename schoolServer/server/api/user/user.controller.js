'use strict';

var _ = require('lodash');
var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var School = require('../school/school.model');
var Marks = require('../marks/marks.model');

var validationError = function(res, err) {
  return res.json(422, err);
};

var createParent = function(res, request, student) {
  //Create Parent
  var parentEmail = student.parent.replace(" ", "-").toLowerCase()+"@"+student.school.replace(" ", "-").toLowerCase()+".com";
  User.findOne({
    email: parentEmail,
    role: "parent"
  }, function(err, parentData) { // don't ever give out the password or salt
    if (err) return next(err);
    console.log("ParentData", parentData);
    if(parentData) {
      parentData.name = request.parent;
      parentData.students.push({id:student._id,name:student.name,subjects:student.subjects});
      parentData.phone = request.parentPhone;
      parentData.pepper = Math.random().toString(36).substring(9);
      parentData.password = parentData.pepper;
      parentData.provider = request.provider;
      parentData.save(function (err) {
        if (err) { return validationError(res, err); }
        return createTeacher(res, request, student);  
      });
    } else {
      var parentData = {};
      parentData.name = request.parent;
      parentData.email = parentEmail;
      parentData.role = "parent";
      parentData.students = [student._id];
      parentData.students = [{id:student._id,name:student.name, subjects:student.subjects}];
      parentData.phone = request.parentPhone;
      parentData.pepper = Math.random().toString(36).substring(9);
      parentData.password = parentData.pepper;
      parentData.provider = request.provider;
      var newParent = new User(parentData);
      newParent.save(function(err, parent) {
        if (err) return validationError(res, err);
        console.log("Parent Created");
        return createTeacher(res, request, student);  
      });        
    }
  });  
}

var createTeacher = function(res, request, student) {
  //Create Teacher
  var teacherEmail = student.teacher.replace(" ", "-").toLowerCase()+"@"+student.school.replace(" ", "-").toLowerCase()+".com";
  console.log("Email: "+teacherEmail);
  User.findOne({email:teacherEmail}, function(err, teacherData) {
    if (err) return next(err);
    console.log("Teacher: ",teacherData);
    if(teacherData) {
      teacherData.name = request.teacher;
      teacherData.phone = request.teacherPhone;
      teacherData.pepper = Math.random().toString(36).substring(9);
      teacherData.password = teacherData.pepper;
      teacherData.provider = request.provider;
      teacherData.students.push({id:student._id,name:student.name,subjects:student.subjects});
      teacherData.typeofexams = request.typeofexams.replace(/ /g,"").split(",");
      teacherData.school = request.school;
      teacherData.standard = request.standard;
      teacherData.division = request.division;      
      teacherData.save(function (err) {
        if (err) { return validationError(res, err); }
        console.log("Teacher updated");
        return res.json(200, teacherData);
      });
    } else {
      var teacherData = {};
      teacherData.name = request.teacher;
      teacherData.email = teacherEmail;
      teacherData.role = "teacher";
      teacherData.students = [{id:student._id,name:student.name, subjects: student.subjects}];
      teacherData.phone = request.teacherPhone;
      teacherData.pepper = Math.random().toString(36).substring(9);
      teacherData.password = teacherData.pepper;
      teacherData.provider = request.provider;
      teacherData.typeofexams = request.typeofexams.replace(/ /g,"").split(",");
      teacherData.school = request.school;
      teacherData.standard = request.standard;
      teacherData.division = request.division;
      var newTeacher = new User(teacherData);
      newTeacher.save(function(err, teacher) {
        if (err) return validationError(res, err);
        console.log("Teacher Created");          
        return res.json(200, teacher);
      });    
    }
  });
}
/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.json(200, users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  //Create student
  var userData = req.body;
  userData.provider = 'local';
  userData.role = "student";
  userData.pepper = Math.random().toString(36).substring(10);
  userData.password = userData.pepper;
  userData.name = req.body.student;
  if(req.body.import) {
    userData.subjects = req.body.subjects.replace(/ /g,"").split(",");
    userData.typeofexams = req.body.typeofexams.replace(/ /g,"").split(",");
    delete req.body.import;
    console.log("Requested: ", req.body);
    User.findOne({
      email:req.body.email,
      role:"student",
    }, '-salt -hashedPassword', function(err, studentData) {
      console.log("studentData", studentData);
      if(studentData) {
        var studentUpdated = _.merge(studentData, userData);
        studentUpdated.save(function (err) {
          if (err) { return validationError(res, err); }
          console.log("Student Updated");
          return createParent(res, req.body, studentData);        
        });
      } else {
        var userStudent = new User(userData);
        userStudent.save(function(err, student) {
          if (err) return validationError(res, err);
          console.log("Student Created");
          return createParent(res, req.body, student);
        });      
      }
    });      
  } else {    
    var newUser = new User(userData);
    newUser.provider = "local";
    newUser.role = 'user';
    newUser.save(function(err, user) {
      if (err) return validationError(res, err);
      var studentUpdated = _.merge(studentData, userData);
      studentUpdated.save(function (err) {
        if (err) { return validationError(res, err); }
        return res.json(200, studentData);
      });
      var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
      res.json({ token: token });
    });
  }
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

var senduserdata = function(res, user, data) {
  School.findOne({
        school: user.school
      }, function(err, school) {
        if (err) return next(err);
        if(!school) return res.json(401);
        console.log("school", school);
        data.passmark = school.passmark;
        data.grades = school.grades;
        data.schoolid = school._id;
        data.school = user.school;
        data.period = school.period;
        console.log("user and school: ", data);
        Marks.find({schoolid: school._id}).sort({_id: -1}).limit(1).populate('*').exec(function(err, lastmark) {
          console.log("Lastmark", lastmark);
          data.educationyear = lastmark[0].educationyear;
          data.years = [];
          if(lastmark[0].educationyear.indexOf("-") > -1) {
            var year = lastmark[0].educationyear.split("-");
            data.years.push(year[0] - 1 +"-"+year[0]);
          } else {
            data.years.push(data.educationyear - 1);
          }
          data.years.push(data.educationyear);
          return data;
        });
      });
}
/**
* Verify an user
*/
exports.verify = function(req, res, next) {
console.log('user', req.body); 
User.findOne({
    email: req.body.email
  }, function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if(user.authenticate(req.body.password)) {
      if (!user) return res.json(401);
      var data = {};
      data._id = user._id;
      data.email = user.email;
      data.name = user.name;
      data.role = user.role;
      data.token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
      if((user.role == 'teacher') || (user.role == 'parent')) {
        data.division = user.division;
        data.standard = user.standard;
        data.phone = user.phone;
        data.typeofexams = user.typeofexams;
        data.students = user.students;
        var subjects = {};
        for (var i = 0; i <= user.students.length - 1; i++) {
          subjects = _.merge(subjects, user.students[i].subjects);
        }
        data.subjects = subjects;
        data = senduserdata(res, user, data);
        res.json(data);
      } else if (user.role == "hm") {
        User.find({schoolid: user.schoolid, role: "student"}, function(er, allusers) {
        var subjects = [];
        var typeofexams = [];
        for (var i = 0; i <= allusers.length - 1; i++) {
          subjects = subjects.concat(allusers.subjects);
          typeofexams = typeofexams.concat(allusers.typeofexams);
        }
        data.subjects = _.uniq(subjects);
        data.typeofexams = _.uniq(typeofexams);  
        data = senduserdata(res, user, data);
        console.log("DATA SENT:", data);
        res.json(data);
        })
      }
    } else {
      res.json({status: 'password not matching'});
    }
  }); 
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.json(401);
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
