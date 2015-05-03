'use strict';

var express = require('express');
var controller = require('./marks.controller');

var router = express.Router();
router.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if ('OPTIONS' == req.method){
        return res.send(200);
    }
    next();
});
router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/:schoolid/:educationyear/:typeofexam/:studentid/:standard/:division', controller.getMark);
router.get('/:typeofexam', controller.getAllMarks);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;