'use strict';

angular.module('schoolServerApp')
  .controller('AddmarksCtrl', function ($scope, $http, Auth) {
  	var user = Auth.getCurrentUser();
  	$scope.schools = [];
  	var marks = {};
  	$scope.listSchool = true;
  	if(user.role == "hm") {
  		$scope.listSchool = false;
	  	$http.get('/api/schools/'+user.schoolid).success(function(schoolItem) {
  			schoolValues(schoolItem);
	  	});
  	} else if (user.role == "admin") {
  		$http.get('/api/schools').success(function(schools) {
	  		console.log("schools", schools);
	  		$scope.schools = schools;
	  	});
  	}

  	$scope.addschoolmarks = function(schoolItem) {
	  	$scope.listSchool = false;
  		console.log("schoolitem", schoolItem);
  		schoolValues(schoolItem);
  	}

  	var schoolValues = function(school) {
  		marks.school = school.school;
  		marks.schoolid = school._id;
  		console.log("Marks: ", marks);
  	}
  });
