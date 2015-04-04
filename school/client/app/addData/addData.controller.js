'use strict';

angular.module('schoolApp')
  .controller('AddDataCtrl', function ($scope, $http) {
  	$scope.result = '';
    $scope.ipdata = {};
    $scope.school = {};
	$scope.processing = false;
    $scope.csvImport = function(csvdata) {
        if(csvdata && !$scope.processing) {
            $scope.processing = true;
            var updatedResults = [];
            var lastknown = [];
            $scope.updatedItems = [];
            var newdata = JSON.parse(csvdata);
            angular.forEach(newdata, function(data, index) {
                var lastknownData = {};
                angular.forEach(data, function(d, i) {
                    var head = i.toLowerCase().split(";");
                    var row = d.split(";");
                    if(row.length > 1) {
                        angular.forEach(row, function(r, k) {
                            lastknownData[head[k]] = r;
                        })
                        console.log('LastknownData', lastknownData);
                        lastknownData["import"] = true;
                        lastknownData["school"] = $scope.school.school;
                        lastknownData["email"] = lastknownData["student"].replace(" ", "-").toLowerCase()+"@"+lastknownData["school"].replace(" ", "-").toLowerCase()+".com";
                        lastknown.push(lastknownData);
                    }
                });
            })
            var schoolData = $scope.school;
/*            schoolData.typeofexams = schoolData.typeofexams.split(",");
            schoolData.subjects = schoolData.subjects.split(",");*/
            var allGrades = schoolData.grades.split(",");
            var grades = [];
            angular.forEach(allGrades, function(g, gi) {
                console.log("g", g);
                console.log("gi", gi);
                var values = g.split(":");
                var range = values[1].split("-");
                grades[gi] = {};
                grades[gi]["grade"] = values[0];
                grades[gi]["lesser"] = parseInt(range[0]);
                grades[gi]["greater"] = parseInt(range[1]);
            });
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
        }).error(function(err) {
            console.log('error', err);
     //       $scope.updatedItems.push({Status:error,ID: lastknownData.username, Username: lastknownData.email});
        });
    }    
  });
