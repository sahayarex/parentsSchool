'use strict';

angular.module('schoolServerApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/addData', {
        templateUrl: 'app/addData/addData.html',
        controller: 'AddDataCtrl'
      });
  });
