'use strict';
// Ionic Starter App, v0.9.20

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
var app = angular.module('parentsSchool', ['ionic', 'config', 'chart.js', 'parentsSchool.services', 'parentsSchool.controllers'])

.run(function($ionicPlatform, $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
  $rootScope.filters = false;
})

.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
              scope.$apply(function (){
                  scope.$eval(attrs.ngEnter);
              });
              event.preventDefault();
            }
        });
    };
})
/*
.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
})

.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
})
*/
.directive('clickOnce', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var replacementText = attrs.clickOnce;

            element.bind('click', function() {
                $timeout(function() {
                    if (replacementText) {
                        element.html(replacementText);
                    }
                    element.attr('disabled', true);
                }, 0);
            });
        }
    };
})
.directive('ionSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            getData: '&source',
            model: '=?',
            search: '=?filter'
        },
        link: function(scope, element, attrs) {
            attrs.minLength = attrs.minLength || 0;
            scope.placeholder = attrs.placeholder || '';
            scope.search = {value: ''};
            if (attrs.class)
                element.addClass(attrs.class);

            if (attrs.source) {
                scope.$watch('search.value', function (newValue, oldValue) {
                  console.log('newValue', newValue);
                  console.log('oldValue', oldValue);
                    if (newValue.length > attrs.minLength) {
                        scope.getData({str: newValue}).then(function (results) {
                            scope.model = results;
                        });
                    } else {
                        scope.model = [];
                    }
                });
            }

            scope.clearSearch = function() {
                scope.search.value = '';
            };
        },
        template: '<div class="item-input-wrapper">' +
                    '<i class="icon ion-android-search"></i>' +
                    '<input type="search" placeholder="{{placeholder}}" ng-model="search.value">' +
                    '<i ng-if="search.value.length > 0" ng-click="clearSearch()" class="icon ion-close"></i>' +
                  '</div>'
    };
})
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })
   .state('app.dashboard', {
      url: "/dashboard",
      views: {
        'menuContent' :{
          templateUrl: "templates/dashboard.html",
          controller: 'DashboardCtrl'
        }
      }
    })
   .state('app.dashboardFilters', {
      url: "/dashboard/:year/:typeofexam",
      views: {
        'menuContent' :{
          templateUrl: "templates/dashboard.html",
          controller: 'DashboardCtrl'
        }
      }
    })
    .state('app.allstudents', {
      url: "/allstudents",
      views: {
        'menuContent' :{
          templateUrl: "templates/allstudents.html",
          controller: 'AllStudentsCtrl'
        }
      }
    })       
   .state('app.marks', {
      url: "/marks",
      views: {
        'menuContent' :{
          templateUrl: "templates/marks.html",
          controller: 'MarksCtrl'
        }
      }
    })   
    .state('app.students', {
      url: "/marks/:year/:typeofexam",
      views: {
        'menuContent' :{
          templateUrl: "templates/students.html",
          controller: 'StudentsCtrl'
        }
      }
    })    
    .state('app.entermarks', {
      url: "/marks/:year/:typeofexam/:studentid",
      views: {
        'menuContent' :{
          templateUrl: "templates/entermarks.html",
          controller: 'EnterMarksCtrl'
        }
      }
    })
    .state('app.updatemarks', {
      url: "/marks/:year/:typeofexam/:studentid/:action",
      views: {
        'menuContent' :{
          templateUrl: "templates/updatemarks.html",
          controller: 'UpdateMarksCtrl'
        }
      }
    })    
    .state('app.home', {
      url: "/home",
    views: {
        'menuContent' :{
            controller:  "HomeCtrl",
            templateUrl: "templates/home.html"              
        }
    }         
    })
    .state('app.createPage', {
      url: "/create-page",
    views: {
        'menuContent' :{
            controller:  "CreatePageCtrl",
            templateUrl: "templates/create-page.html"              
        }
    }         
    })    
    .state('app.entries-today', {
      url: "/entries-today",
    views: {
        'menuContent' :{
            controller:  "EntriesTodayCtrl",
            templateUrl: "templates/entries-today.html"              
        }
    }         
    })
    .state('app.logout', {
      url: "/logout",
      views: {
         'menuContent' :{
           controller: "LogoutCtrl"
          }
      } 
    });
  $urlRouterProvider.otherwise("/app/home");

});

app.value("user", {});