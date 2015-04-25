'use strict';

angular.module('schoolServerApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/addmarks', {
        templateUrl: 'app/addmarks/addmarks.html',
        controller: 'AddmarksCtrl'
      });
  });
