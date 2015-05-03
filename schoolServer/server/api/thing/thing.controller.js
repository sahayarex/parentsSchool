/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Thing = require('./thing.model');
var Marks = require('../marks/marks.model');
var User = require('../user/user.model');

// Get list of things
exports.index = function(req, res) {
/*          User.find({schoolid: "553f26aae41009b83febb751", role: "student"}, function(er, allusers) {
        console.log("length", allusers.length);
        var subjects = [];
        var typeofexams = [];
        for (var i = 0; i <= allusers.length - 1; i++) {
          for (var j = 0; j < allusers[i].subjects.length; j++) {
            if(subjects.indexOf(allusers[i].subjects[j]) == -1) {
              subjects.push(allusers[i].subjects[j]);
            } 
          }
          for (var k = 0; k < allusers[i].typeofexams.length; k++) {
            if(typeofexams.indexOf(allusers[i].typeofexams[k]) == -1) {
              typeofexams.push(allusers[i].typeofexams[k]);
            } 
          }
        }
        console.log("subjects", subjects);
        console.log("typeofexams", typeofexams);
        })*/
  Thing.find(function (err, things) {
    if(err) { return handleError(res, err); }
    return res.json(200, things);
  });
};

// Get a single thing
exports.show = function(req, res) {
  Thing.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    return res.json(thing);
  });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
  Thing.create(req.body, function(err, thing) {
    if(err) { return handleError(res, err); }
    return res.json(201, thing);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Thing.findById(req.params.id, function (err, thing) {
    if (err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    var updated = _.merge(thing, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, thing);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
  Thing.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    thing.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}