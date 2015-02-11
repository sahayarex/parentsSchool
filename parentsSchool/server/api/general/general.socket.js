/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var General = require('./general.model');

exports.register = function(socket) {
  General.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  General.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('general:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('general:remove', doc);
}