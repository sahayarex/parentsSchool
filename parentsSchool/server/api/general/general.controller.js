'use strict';

var _ = require('lodash');
var General = require('./general.model');

// Get list of generals
exports.index = function(req, res) {
  General.find(function (err, generals) {
    if(err) { return handleError(res, err); }
    return res.json(200, generals);
  });
};

// Get a single general
exports.show = function(req, res) {
  General.find({school:req.params.school}, function (err, general) {
    if(err) { return handleError(res, err); }
    if(!general) { return res.send(404); }
    return res.json(general);
  });
};

// Creates a new general in the DB.
exports.create = function(req, res) {
  console.log('body', req.body);
  General.create(req.body, function(err, general) {
    if(err) { return handleError(res, err); }
    return res.json(201, general);
  });
};

// Updates an existing general in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  General.findById(req.params.id, function (err, general) {
    if (err) { return handleError(res, err); }
    if(!general) { return res.send(404); }
    var updated = _.merge(general, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, general);
    });
  });
};

// Deletes a general from the DB.
exports.destroy = function(req, res) {
  General.findById(req.params.id, function (err, general) {
    if(err) { return handleError(res, err); }
    if(!general) { return res.send(404); }
    general.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}