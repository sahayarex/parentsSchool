'use strict';

angular.module('schoolServerApp')
  .controller('AddmarksCtrl', function ($scope, $http, Auth) {
  	$scope.processing = false;
  	var user = Auth.getCurrentUser();
  	$scope.schools = [];
  	var marks = {};
  	var school = {};
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

  	var schoolValues = function(schoolValues) {
  		school = schoolValues;
  		console.log("Marks: ", marks);
  	}

	$scope.csvImport = function(csvdata) {
    	console.log("csvdata", csvdata);
    	var allmarks = [];
        if(csvdata && !$scope.processing) {
            $scope.processing = true;
            var newdata = csvdata;
            angular.forEach(newdata, function(data, index) {
                angular.forEach(data, function(d, i) {
                	var mark = {};
                	mark.school = school.school;
			  		mark.schoolid = school._id;
			  		mark.passmark = school.passmark;
			  		mark.grades = school.grades;
			  		mark.period = school.period;
                    var head = i.toLowerCase().split(/[,;]/);
                    var row = d.split(/[,;]/);
                    if(row.length > 1) {
                        angular.forEach(row, function(r, k) {
                    		mark[head[k]] = r;
                        })
                        mark.import = true;
                        console.log('MarksData', mark);
                        var i = 0;
                        $http.post('/api/marks', mark).success(function(created) {
			                console.log("school", created);
			                console.log("i", i);
                        	i++;
                        	if(i == csvdata.length - 1) {
                        		console.log("all done man");
                        	}
                        	$scope.processing = false;
			            }).error(function(err) {
			                console.log('error', err);
			            });
                    }
                });
            })

        }
    }  	
  });
