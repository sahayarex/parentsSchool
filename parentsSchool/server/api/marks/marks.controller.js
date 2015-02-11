'use strict';

var _ = require('lodash');
var Marks = require('./marks.model');

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

// Creates a new marks in the DB.
exports.create = function(req, res) {
  Marks.create(req.body, function(err, marks) {
    if(err) { return handleError(res, err); }
    return res.json(201, marks);
  });
};

// Updates an existing marks in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Marks.findById(req.params.id, function (err, marks) {
    if (err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    var updated = _.merge(marks, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, marks);
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