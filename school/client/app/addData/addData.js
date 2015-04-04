'use strict';

angular.module('schoolApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/addData', {
        templateUrl: 'app/addData/addData.html',
        controller: 'AddDataCtrl'
      });
  });
