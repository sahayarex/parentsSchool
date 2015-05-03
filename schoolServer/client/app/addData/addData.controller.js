'use strict';

angular.module('schoolServerApp')
  .controller('AddDataCtrl', function ($scope, $http, $location) {
  	$scope.result = '';
    $scope.ipdata = {};
    $scope.school = {};
    $scope.school.school = "school a";
    $scope.school.schoolphone = "8951572125";
    $scope.school.grades = "Grade A:60-100,Grade B:50-59,Grade C:40-49,Grade F:0-39";
    $scope.school.ranking = "grade";
    $scope.school.passmark = 40;
    $scope.school.period = "June-April";
	$scope.processing = false;
    $scope.csvImport = function(csvdata) {
    	console.log("csvdata", csvdata);
        if(csvdata && !$scope.processing) {
            $scope.processing = true;
            var updatedResults = [];
            var lastknown = [];
            $scope.updatedItems = [];
            var newdata = csvdata;
            angular.forEach(newdata, function(data, index) {
                var lastknownData = {};
                angular.forEach(data, function(d, i) {
                    var head = i.toLowerCase().split(";");
                    var row = d.split(";");
                    if(row.length > 1) {
                        angular.forEach(row, function(r, k) {
                            lastknownData[head[k]] = r;
                        })
                        lastknownData["import"] = true;
                        lastknownData["school"] = $scope.school.school;
                        lastknownData["email"] = lastknownData["student"].replace(" ", "-").toLowerCase()+lastknownData["studentid"]+"@"+lastknownData["school"].replace(" ", "-").toLowerCase()+".com";
                        lastknown.push(lastknownData);
                    }
                });
            })
            var schoolData = $scope.school;
            var allGrades = schoolData.grades.split(",");
            var grades = [];
            console.log("rank", schoolData.ranking);
            if(schoolData.ranking == 'grade') {
                angular.forEach(allGrades, function(g, gi) {
                    var values = g.split(":");
                    var range = values[1].split("-");
                    grades[gi] = {};
                    grades[gi]["grade"] = values[0];
                    grades[gi]["lesser"] = parseInt(range[0]);
                    grades[gi]["greater"] = parseInt(range[1]);
                });
            } else {
                angular.forEach(allGrades, function(g, gi) {
                    var range = g.split("-");
                    grades[gi] = {};
                    grades[gi]["grade"] = g;
                    grades[gi]["lesser"] = parseInt(range[0]);
                    grades[gi]["greater"] = parseInt(range[1]);
                });
            }
            schoolData.grades = grades;
            console.log("schoolData", schoolData);
            $http.post('/api/schools', schoolData).success(function(school) {
                console.log("school", school);
                createUser(lastknown, school, 0);
            }).error(function(err) {
                console.log('error', err);
            });        

        }
    }

    var createUser = function(userData, schoolData, i) {
        userData[i].schoolid = schoolData._id;
        userData[i].school = schoolData.school;
        console.log("userDataSent", userData[i]);
        $http.post('/api/users', userData[i]).success(function(created) {
            i++;
            console.log("total items ", userData.length);
            console.log("iterate ", i);
            if(userData.length > i) {
                createUser(userData, schoolData, i);
            }
            if(userData.length == i) {
            	$location.path('/');
            }
        }).error(function(err) {
            console.log('error', err);
     //       $scope.updatedItems.push({Status:error,ID: lastknownData.username, Username: lastknownData.email});
        });
    }    
  });

