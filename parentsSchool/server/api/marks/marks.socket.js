/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Marks = require('./marks.model');

exports.register = function(socket) {
  Marks.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Marks.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('marks:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('marks:remove', doc);
}