'use strict';

angular.module('schoolApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/addmarks', {
        templateUrl: 'app/addmarks/addmarks.html',
        controller: 'AddmarksCtrl'
      });
  });
