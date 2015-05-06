angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $stateParams, $cordovaSQLite, $rootScope, $state, AuthenticationService) {
  $scope.uid = localStorage.getItem('uid') || '';
  user = JSON.parse(localStorage.getItem('user')) || user;
  if($scope.uid) {
    $scope.authorized = true;
    localStorage.setItem('processing', 'No');
    if(user.role == "hm") {
      $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app.hmdashboard", "class":"ion-stats-bars"}, {"title":"Classes", "href":"app.allclasses", "class": "ion-easel"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
      $state.go('app.hmdashboard', {}, {reload: true});
    } else if (user.role == "parent") {
      $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app.dashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
      $state.go('app.dashboard', {}, {reload: true});
    } else {
      $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app.dashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
      $state.go('app.dashboard', {}, {reload: true});
    }
  } else {
    $scope.authorized = false;
    $scope.menuLinks = {"Links":[{"title":"log-in", "href":"app.home", "class": "ion-log-in"}]};
  }
  if(localStorage.getItem('filterdata')) {
    var filtersData = JSON.parse(localStorage.getItem('filterdata'));
  } else {
    var filtersData = {};
    filtersData.years = user.years;
    filtersData.educationyear = user.years.indexOf(user.educationyear);
    user.typeofexams.unshift("All");
    filtersData.typeofexams = user.typeofexams;
    filtersData.typeofexam = user.typeofexams.indexOf(user.latesttypeofexam);
  }
/*  var filterStatus = function(page) {
    console.log("dashboard index:", page.indexOf('ashboard'));
    console.log("Page:", page);
    if(page.indexOf('ashboard') > 0) {
        $rootScope.filters = true;
        $scope.filters = true;
    } else {
        $rootScope.filters = false;
        $scope.filters = false;
    }
  } 
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
    filterStatus(toState.name);
  })
  
  filterStatus($state.current.name);*/
/*    var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
    if(Object.keys($stateParams).length > 0) {
      filtersData.educationyear = $stateParams.educationyear;
      filtersData.typeofexam = user.typeofexams.indexOf($stateParams.typeofexam);
    } else {
      if(Object.keys(latestUpdated).length > 0) {
        filtersData.educationyear = latestUpdated.educationyear;
        filtersData.typeofexam = user.typeofexams.indexOf(latestUpdated.typeofexam);
      }
    }
    console.log("FiltersData:", filtersData);*/
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $rootScope.filtersData = filtersData;
    $rootScope.filters = true;
    $scope.filters = true;
    $rootScope.page = $state.current.name;
  //Sync online
  setInterval(function() {
    var processing = localStorage.getItem('processing');
    if(processing != 'Yes') {
      if(AuthenticationService.online()) {
        $cordovaSQLite.execute(db, "select id, student, studentid, school, schoolid, typeofexam, marks, total, percentage, grade, attendance, status, year, educationyear, subjects, teacher, teacherid, standard, division, created, action from marks", []).then(function(res) {
          if(res.rows.length > 0) {
            for (var i = 0; i <= res.rows.length - 1; i++) {
              localStorage.setItem("sqlrow", JSON.stringify(res.rows.item(i)));
              var item = JSON.parse(localStorage.getItem("sqlrow")) || {};
              item.marks = JSON.parse(item.marks);
              item.subjects = JSON.parse(item.subjects);
              if(item.action == "create") {
              console.log("local result: ", item);
                AuthenticationService.saveMarks(item).then(function(data) {
                    console.log("Created Data: ", data);
                  if(data._id) {
                    var query = "UPDATE marks SET _id = ?, action = ? WHERE id = ?";
                    $cordovaSQLite.execute(db, query, [data._id, 'created',item.id]).then(function(created) {
                      console.log("updated", created.rows);
                    }, function(createdErr) {
                      console.log("updated err", updatedErr);
                    })
                    localStorage.removeItem("sqlrow");
                    localStorage.setItem('processing', 'No');
                  }
                });  
              } else if (item.action == "update") {
                AuthenticationService.updateMarks(item).then(function(updated) {
                  if(updated._id) {
                    var query = 'UPDATE marks SET action = "updated" WHERE id = '+item.id;
                    $cordovaSQLite.execute(db, query).then(function(created) {
                      console.log("updated", created.rows.item(0));
                    }, function(createdErr) {
                      console.log("updated err", updatedErr);
                    })
                    localStorage.removeItem("sqlrow");
                    localStorage.setItem('processing', 'No');
                  }
                });                
              }              
            };
          }
        }, function(err) {
          //console.log("local err", err);
        })

      }
    }
  }, 3000);  
})
.controller('HmDashboardCtrl', function($scope, $rootScope, $state, _, $cordovaSQLite, AuthenticationService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.hmfilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    $scope.getMarksData();
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  var updateditems = subjectMarks = subjectLabels = gradeLabels = subjectDataPass = subjectDataFail = toppers = [];  
  var pass = fail = attendanceVal = totalrecords = 0;
  $scope.getMarksData = function() {
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    if(!params.studentid) {
      params.studentid = "all";
    }
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+'_hm';
    if(AuthenticationService.online()) {
      AuthenticationService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectMarks = [];
          subjectLabels = []; 
          gradeLabels = [];
          subjectDataPass = [];
          subjectDataFail = [];    
          toppers = [];
          var gradeData = j = [];
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            console.log("record count", sres.rows.length);
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.dashboardStatus = "empty";
        }    
      });
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectMarks = [];
          subjectLabels = []; 
          gradeLabels = [];
          subjectDataPass = [];
          subjectDataFail = [];    
          toppers = [];
          var gradeData = j = [];
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {
          $scope.dashboardStatus = "empty";
        }
      }, function(err) {

      });
    }
  }
  var kkkk = 0;
  var processMarksVal = function(v, k, status) {
    var subjects = user.subjects;
    var marks = v.marks;
    if(status == "offline") {
     // subjects = JSON.parse(v.subjects);
      marks = JSON.parse(v.marks);
    }
      if(v.status == "Pass")
          pass++;
      if(v.status == "Fail")
          fail++;
      if(toppers[v.standard]) {
        if(toppers[v.standard].total < v.total) {
          toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division, total: v.total};
        }
      } else {
        toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division, total: v.total};
      }
      marks.forEach(function(mv, mk) {
        angular.forEach(mv, function(mvv, mkk) {
          if(subjects.indexOf(mkk) > -1) {
            subjectDataPass[mkk] = (subjectDataPass[mkk]) ? subjectDataPass[mkk] : 0;
            subjectDataFail[mkk] = (subjectDataFail[mkk]) ? subjectDataFail[mkk] : 0;   
            if(mvv >= user.passmark) {
              subjectDataPass[mkk]++;
            } else {
              subjectDataFail[mkk]++;
            }
          }
        })
      })

      gradeLabels = [];
      for (var i = 0; i < user.grades.length; i++) {
        j[i] = (j[i]) ? j[i] : 0;
        if(user.grades[i].grade == v.grade) {
            j[i]++;
        }
        gradeLabels[i] = user.grades[i].grade;
      };
      gradeData = j;
      if(attendanceVal > 0) {
        attendanceVal = parseInt(v.attendance);
      } else {
        attendanceVal = attendanceVal + parseInt(v.attendance);
      }
  }
  var applyMarks = function() {
    var toppersList = [];
    _.each(toppers, function(v, k) {
      if(v) {
        toppersList.push(v);
      }
    });
    console.log("toppersList", toppersList);
    $scope.toppers = toppersList;
    $scope.statusLabels = ["Pass", "Fail"];
    $scope.subjectSeries = ["Pass", "Fail"];
    $scope.subjectData = []; 
    $scope.subjectLabels = user.subjects;
    var passvals = []
    var failvals = []
    angular.forEach(user.subjects, function(us, uk) {
      passvals.push(subjectDataPass[us]);
      failvals.push(subjectDataFail[us]);
    })
    $scope.subjectData = [
      passvals,failvals
    ];
    $scope.statusData = [pass,fail];
    $scope.gradeData = [gradeData];
    $scope.gradeLabels = gradeLabels;
  }
})
.controller('DashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, AuthenticationService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.filterResults = function(page) {
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var updateditems = [];
  var subjectMarks = [];
  var pass = fail = attendanceVal = totalrecords = 0;
  var subjectLabels = []; 
  var gradeLabels = [];
  var subjectDataPass = [];
  var subjectDataFail = [];  
  var subjectDataMarks = [];    
  var toppers = [];  
  var topperSubjects = [];
  var allsubjects = [];
  $scope.getMarksData = function() {
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.standard = user.standard;
    params.division = (user.division) ? user.division : "all";
    if(!params.studentid) {
      params.studentid = "all";
    }
    var standard = '';
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      standard = '_'+$stateParams.standard;
      $scope.standard = $stateParams.standard;
    }
    var division = '_all';
    if($stateParams.division) {
      params.division = $stateParams.division;
      division = '_'+$stateParams.division;
      $scope.division = $stateParams.division;
    }    
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+standard+division;
    if(AuthenticationService.online()) {
      AuthenticationService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectMarks = [];
          subjectLabels = []; 
          gradeLabels = [];
          subjectDataPass = [];
          subjectDataFail = []; 
          subjectDataMarks = [];       
          toppers = [];
          topperSubjects = [];
          var gradeData = j = [];
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.dashboardStatus = "empty";
        }    
      });
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectMarks = [];
          subjectLabels = []; 
          gradeLabels = [];
          subjectDataPass = [];
          subjectDataFail = [];
          subjectDataMarks = [];    
          toppers = [];
          topperSubjects = [];
          var gradeData = j = [];
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {
          $scope.dashboardStatus = "empty";
        }
      }, function(err) {

      });
    }
  }
  var kkkk = 0;
  var processMarksVal = function(v, k, status) {
    //var subjects = user.subjects;
    var marks = v.marks;
    if(status == "offline") {
     // subjects = JSON.parse(v.subjects);
      marks = JSON.parse(v.marks);
    }
      if(v.status == "Pass")
          pass++;
      if(v.status == "Fail")
          fail++;
      if(toppers[v.standard]) {
        if(toppers[v.standard].total < v.total) {
          toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division, total: v.total};
        }
      } else {
        toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division, total: v.total};
      }
      marks.forEach(function(mv, mk) {
        angular.forEach(mv, function(mvv, mkk) {
          if((mkk != "status")) {
            if(allsubjects.indexOf(mkk) == -1) {
              allsubjects.push(mkk);
            }
            subjectDataPass[mkk] = (subjectDataPass[mkk]) ? subjectDataPass[mkk] : 0;
            subjectDataFail[mkk] = (subjectDataFail[mkk]) ? subjectDataFail[mkk] : 0;   
            if(mvv >= user.passmark) {
              subjectDataPass[mkk]++;
            } else {
              subjectDataFail[mkk]++;
            }
            if(subjectDataMarks[mkk]) {
              subjectDataMarks[mkk] = parseInt(mvv) + subjectDataMarks[mkk];
            } else {
              subjectDataMarks[mkk] = parseInt(mvv);
            }
            if(topperSubjects[mkk]) {
              if(parseInt(mvv) > topperSubjects[mkk].total) {
                topperSubjects[mkk] = {total: mvv, student:v.student, subject: mkk, classd: v.standard+v.division.toUpperCase()};              
              } else if (parseInt(mvv) == topperSubjects[mkk].total) {
                topperSubjects[mkk].student = topperSubjects[mkk].student + "," + v.student;
              }
            } else {
              topperSubjects[mkk] = {total: mvv, student:v.student, subject: mkk, classd: v.standard+v.division.toUpperCase()};              
            }
            console.log("mark", topperSubjects[mkk]);
          }
        })
      })

      gradeLabels = [];
      for (var i = 0; i < user.grades.length; i++) {
        j[i] = (j[i]) ? j[i] : 0;
        if(user.grades[i].grade == v.grade) {
            j[i]++;
        }
        gradeLabels[i] = user.grades[i].grade;
      };
      gradeData = j;
      if(attendanceVal > 0) {
        attendanceVal = parseInt(v.attendance);
      } else {
        attendanceVal = attendanceVal + parseInt(v.attendance);
      }
  }
  var applyMarks = function() {
    var toppersList = [];
    _.each(toppers, function(v, k) {
      if(v) {
        toppersList.push(v);
      }
    });
    $scope.toppers = toppersList;
    $scope.statusLabels = ["Pass", "Fail"];
    $scope.subjectSeries = ["Pass", "Fail"];
    $scope.subjectData = []; 
    $scope.subjectLabels = allsubjects;
    var passvals = [];
    var failvals = [];
    var marksvals = [];
    var topperS = [];
    angular.forEach(allsubjects, function(us, uk) {
      if(subjectDataPass[us]) {
        passvals.push(subjectDataPass[us]);
        failvals.push(subjectDataFail[us]);
      } else {
        passvals.push(0);
        failvals.push(0);
      }
      if(subjectDataMarks[us]) {
        marksvals.push(subjectDataMarks[us]*(100/(totalrecords*100)));
      } else {
        marksvals.push(0);
      }
      if(topperSubjects[us]) {
        topperS.push(topperSubjects[us]);
      } else {
        topperS.push({total:0, student:"", subject: us, classd: ""});
      }
    })
    console.log("labels", allsubjects);
    $scope.subjectData = [
      passvals,failvals
    ];
    $scope.subjectMarks = [
      marksvals
    ];
    $scope.subjectToppers = topperS;
    console.log("values", $scope.subjectData);
    $scope.statusData = [pass,fail];
    $scope.gradeData = [gradeData];
    $scope.gradeLabels = gradeLabels;
  }
})
.controller('AllClassesCtrl', function($scope, $rootScope, $cordovaSQLite, AuthenticationService) {
  var processUsers = function(users) {
    $scope.allClasses = true;
    var classes = [];
    var all = [];
    var standard = [];
    angular.forEach(users, function(uv, uk) {
      var allusers = [];
      var classd = uv.standard + uv.division;
      if(classes.indexOf(classd) == -1) {
        uv.classd = uv.standard + uv.division;
        allusers.push(uv);
        classes.push(classd);
        var sdkey = uv.standard+uv.division;
        var skey = uv.standard;
        if(uv.standard.length > 1) {
          sdkey = "_"+sdkey;
          skey = "_"+skey;
        }
        if(standard.indexOf(uv.standard) == -1 ) {
          all.push({standard:uv.standard, d: "all", division: "", classd: skey});
          standard.push(uv.standard);
        }
        all.push({standard:uv.standard, d:uv.division, division: uv.division.toUpperCase(), classd: sdkey});
      }
    });
    $scope.users = all;
  }
  $scope.getClassesData = function() {
    var params = {};
    params.schoolid = user.schoolid;
    var dbkey = user.schoolid+"_students";
    if(AuthenticationService.online()) {
      AuthenticationService.getUsers(params).then(function(users) {
        if(users.length > 0) {
          console.log("Got all users:", users);
          processUsers(users);
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allClasses = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          processUsers(allusers);
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }  
})
.controller('AllStudentsCtrl', function($scope, $stateParams, $rootScope, $cordovaSQLite, AuthenticationService) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.getStudentsData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += "_"+$stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += "_"+$stateParams.division;
    }
    if(AuthenticationService.online()) {
      AuthenticationService.getUsers(params).then(function(users) {
        if(users.length > 0) {
          console.log("Got all users:", users);
          $scope.allStudents = true;
          $scope.users = users;
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allStudents = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          $scope.allStudents = true;
          $scope.users = allusers;
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
})
.controller('StudentDashboardCtrl', function($scope, $rootScope, $cordovaSQLite, $state, $stateParams, $ionicSideMenuDelegate, AuthenticationService) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.user = user;
  $rootScope.studentFilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var subjectMarks = [];
  var subjectLabels = []; 
  $scope.getMarksData = function() {
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    if($stateParams.studentid) {
      params.studentid = $stateParams.studentid;
    }    
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+params.studentid;
    if(AuthenticationService.online()) {
      AuthenticationService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          subjectMarks = [];
          subjectLabels = []; 
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.dashboardStatus = "empty";
        }    
      });
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          subjectMarks = [];
          subjectLabels = []; 
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
        } else {
          $scope.dashboardStatus = "empty";
        }
      }, function(err) {

      });
    }
  }
  var processMarksVal = function(v, k, status) {
    var marks = v.marks;
    if(status == "offline") {
      marks = JSON.parse(v.marks);
    }
    marks.forEach(function(mv, mk) {
      angular.forEach(mv, function(mvv, mkk) {
        if((mkk != "status")) {
          subjectLabels.push(mkk);
          subjectMarks.push(mvv);
        }
      })
    })
    $scope.subjectLabels = subjectLabels;
    $scope.subjectMarks = [subjectMarks];
    if(v.attendance) {
      $scope.attendanceLabels = ["Present", "Absent"];
      var att = v.attendance.split("/");
      $scope.attendanceData = [att[0], parseInt(att[1]) - parseInt(att[0])];
    }
    $scope.mark = v;
  }
})
.controller('StudentOverallDashboardCtrl', function($scope, $rootScope, $stateParams, $cordovaSQLite, AuthenticationService) {
/*  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.overallFilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var updateditems = [];
  var subjectMarks = [];
  var pass = fail = attendanceVal = totalrecords = 0;
  var subjectLabels = []; 
  var gradeLabels = [];
  var subjectDataPass = [];
  var subjectDataFail = [];  
  var subjectDataMarks = [];    
  var toppers = [];  
  var topperSubjects = [];
  var allsubjects = [];
  $scope.getMarksData = function() {
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.standard = user.standard;
    params.division = (user.division) ? user.division : "all";
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam];
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += '_'+$stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += '_'+$stateParams.division;
    }    
    if($stateParams.studentid) {
      params.studentid = $stateParams.studentid;
      dbkey += '_'+$stateParams.studentid;
    }
    if(!params.studentid) {
      params.studentid = "all";
    }
    console.log("params", params);
    if(AuthenticationService.online()) {
      AuthenticationService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectMarks = [];
          subjectLabels = []; 
          gradeLabels = [];
          subjectDataPass = [];
          subjectDataFail = []; 
          subjectDataMarks = [];       
          toppers = [];
          topperSubjects = [];
          var gradeData = j = [];
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.dashboardStatus = "empty";
        }    
      });
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectMarks = [];
          subjectLabels = []; 
          gradeLabels = [];
          subjectDataPass = [];
          subjectDataFail = [];
          subjectDataMarks = [];    
          toppers = [];
          topperSubjects = [];
          var gradeData = j = [];
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {
          $scope.dashboardStatus = "empty";
        }
      }, function(err) {

      });
    }
  }
  var kkkk = 0;
  var processMarksVal = function(v, k, status) {
    //var subjects = user.subjects;
    var marks = v.marks;
    if(status == "offline") {
     // subjects = JSON.parse(v.subjects);
      marks = JSON.parse(v.marks);
    }
      if(v.status == "Pass")
          pass++;
      if(v.status == "Fail")
          fail++;
      if(toppers[v.standard]) {
        if(toppers[v.standard].total < v.total) {
          toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division, total: v.total};
        }
      } else {
        toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division, total: v.total};
      }
      marks.forEach(function(mv, mk) {
        angular.forEach(mv, function(mvv, mkk) {
          if((mkk != "status")) {
            if(allsubjects.indexOf(mkk) == -1) {
              allsubjects.push(mkk);
            }
            subjectDataPass[mkk] = (subjectDataPass[mkk]) ? subjectDataPass[mkk] : 0;
            subjectDataFail[mkk] = (subjectDataFail[mkk]) ? subjectDataFail[mkk] : 0;   
            if(mvv >= user.passmark) {
              subjectDataPass[mkk]++;
            } else {
              subjectDataFail[mkk]++;
            }
            if(subjectDataMarks[mkk]) {
              subjectDataMarks[mkk] = parseInt(mvv) + subjectDataMarks[mkk];
            } else {
              subjectDataMarks[mkk] = parseInt(mvv);
            }
            if(topperSubjects[mkk]) {
              if(parseInt(mvv) > topperSubjects[mkk].total) {
                topperSubjects[mkk] = {total: mvv, student:v.student, subject: mkk, classd: v.standard+v.division.toUpperCase()};              
              } else if (parseInt(mvv) == topperSubjects[mkk].total) {
                topperSubjects[mkk].student = topperSubjects[mkk].student + "," + v.student;
              }
            } else {
              topperSubjects[mkk] = {total: mvv, student:v.student, subject: mkk, classd: v.standard+v.division.toUpperCase()};              
            }
            console.log("mark", topperSubjects[mkk]);
          }
        })
      })

      gradeLabels = [];
      for (var i = 0; i < user.grades.length; i++) {
        j[i] = (j[i]) ? j[i] : 0;
        if(user.grades[i].grade == v.grade) {
            j[i]++;
        }
        gradeLabels[i] = user.grades[i].grade;
      };
      gradeData = j;
      if(attendanceVal > 0) {
        attendanceVal = parseInt(v.attendance);
      } else {
        attendanceVal = attendanceVal + parseInt(v.attendance);
      }
  }
  var applyMarks = function() {
    var toppersList = [];
    _.each(toppers, function(v, k) {
      if(v) {
        toppersList.push(v);
      }
    });
    $scope.toppers = toppersList;
    $scope.statusLabels = ["Pass", "Fail"];
    $scope.subjectSeries = ["Pass", "Fail"];
    $scope.subjectData = []; 
    $scope.subjectLabels = allsubjects;
    var passvals = [];
    var failvals = [];
    var marksvals = [];
    var topperS = [];
    angular.forEach(allsubjects, function(us, uk) {
      if(subjectDataPass[us]) {
        passvals.push(subjectDataPass[us]);
        failvals.push(subjectDataFail[us]);
      } else {
        passvals.push(0);
        failvals.push(0);
      }
      if(subjectDataMarks[us]) {
        marksvals.push(subjectDataMarks[us]*(100/(totalrecords*100)));
      } else {
        marksvals.push(0);
      }
      if(topperSubjects[us]) {
        topperS.push(topperSubjects[us]);
      } else {
        topperS.push({total:0, student:"", subject: us, classd: ""});
      }
    })
    console.log("labels", allsubjects);
    $scope.subjectData = [
      passvals,failvals
    ];
    $scope.subjectMarks = [
      marksvals
    ];
    $scope.subjectToppers = topperS;
    console.log("values", $scope.subjectData);
    $scope.statusData = [pass,fail];
    $scope.gradeData = [gradeData];
    $scope.gradeLabels = gradeLabels;
  }*/
})
.controller('StudentProfileCtrl', function($scope, $rootScope, $cordovaSQLite, AuthenticationService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.getStudentsData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += "_"+$stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += "_"+$stateParams.division;
    }
    if($stateParams.studentid) {
      params._id = $stateParams.studentid;
      dbkey += "_"+$stateParams.studentid;
    }
    if(AuthenticationService.online()) {
      console.log("GGGGGGGGGGGG", params);
      AuthenticationService.getUsers(params).then(function(users) {
          console.log("Got all users:", users);
        if(users.length > 0) {
          $scope.allStudents = true;
          $scope.user = users[0];
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allStudents = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          $scope.allStudents = true;
          $scope.user = allusers[0];
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
})
.controller('MarksCtrl', function($scope, $rootScope, AuthenticationService) {
  $scope.exams = user.typeofexams;
  
  var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
  if(Object.keys(latestUpdated).length > 0) {
    $scope.year = latestUpdated.year;
  } else {
    $scope.year = new Date().getFullYear();
  }
})
.controller('StudentsCtrl', function($scope, $rootScope, $stateParams) {
  var user = JSON.parse(localStorage.getItem("user")) || {};
  $scope.typeofexam = $stateParams.typeofexam;
  $scope.year = $stateParams.year;
  var updated = JSON.parse(localStorage.getItem("updatedStudents")) || {};
  console.log("updated items:", updated);
  if(Object.keys(updated).length > 0) {
    if(updated[$stateParams.year][$stateParams.typeofexam]) {
      angular.forEach(user.students, function(v,k) {
        if(updated[$stateParams.year][$stateParams.typeofexam][v.id+"time"]) {
          v.id = updated[$stateParams.year][$stateParams.typeofexam][v.id+"time"];
          v.status = "done";
          v.action = "/update";
        }
      })
    }
  }
  console.log("students", user.students);
  $scope.students = user.students;
    
})
.controller('EnterMarksCtrl', function($scope, $rootScope, $cordovaSQLite, $state, $stateParams, AuthenticationService) {
  console.log("State params: ", $stateParams);
  $scope.marks = {};
  $scope.allmarks = {};
  $scope.allmarksStatus = {};
  $scope.subjects = user.subjects;
  angular.forEach(user.students, function(val, key) {
    if(val.id == $stateParams.studentid) {
      $scope.studentname = val.name;
    }
  });
  angular.forEach(user.subjects, function(sv, sk) {
    $scope.allmarksStatus[sv] = true;
  });
  $scope.createMarks = function() {
    $scope.marks.marks = [];
    angular.forEach(user.subjects, function(sv, sk) {
      $scope.marks.marks[sk] = {};
      $scope.marks.marks[sk][sv] = ($scope.allmarks[sv]) ? parseInt($scope.allmarks[sv]) : 0;
    });
    var localData = JSON.parse(localStorage.getItem('localData')) || {};
    var t = new Date();
    var time = t.getTime();
    var year = $stateParams.year;
    $scope.marks.teacherid = user._id;
    $scope.marks.teacher = user.name;
    $scope.marks.year = $stateParams.year;
    $scope.marks.typeofexam = $stateParams.typeofexam;
    $scope.marks.studentid = $stateParams.studentid;
    $scope.marks.student = $scope.studentname;
    $scope.marks.school = user.school;
    $scope.marks.schoolid = user.schoolid;
    $scope.marks.standard = user.standard;
    $scope.marks.division = user.division;
    $scope.marks.subjects = user.subjects;
    $scope.marks.educationyear = localStorage.getItem("educationyear") || '';
    $scope.marks.created = time;
    var total = 0;
    var status = "Pass";
    angular.forEach($scope.marks.marks, function(mv, mk) {
      console.log("v:", mv);
      console.log("k", mk);
      if(mv[user.subjects[mk]] < user.passmark) {
        status = "Fail";
      }
      total = parseInt(total) + parseInt(mv[user.subjects[mk]]);
    });
    var percentage = (total * (100/(user.subjects.length*100))).toPrecision(4);
    angular.forEach(user.grades, function(gv, gk) {
      if((percentage >= gv.lesser) && ((percentage <= gv.greater))) {
        $scope.marks.grade = (status == "Fail") ? "Grade F" : gv.grade;
      }
    })
    $scope.marks.status = status;
    $scope.marks.total = total;
    $scope.marks.percentage = percentage;
    $scope.marks.created = time;
    $scope.marks.action = "create";
    console.log("before store: ", $scope.marks);
    
    var query = "INSERT INTO marks (";
    var queryVal = ") VALUES (";
    var values = [];
    var i = 1;
    console.log("length of marks:", Object.keys($scope.marks).length);
    console.log("length of marks array:", $scope.marks.length);
    angular.forEach($scope.marks, function(av, ak) {
      console.log("i", i);
      if(Object.keys($scope.marks).length == i) {
        query += ak;
        queryVal += "?";
      } else {
        query += ak+", ";
        queryVal += "?,";
      }
      if((ak == "marks") || (ak == "subjects")) {
        values.push(JSON.stringify(av));
      } else {
        values.push(av);
      }
      i++;
    });
    query += queryVal + ")";
    console.log("query: ", query);
    console.log("values", values);
    $cordovaSQLite.execute(db, query, values).then(function(res) {
      console.log("insertId: " + res.insertId);
      alert("res.insertId: "+res.insertId);
    }, function (err) {
      console.error(err);
      alert("error");
    });
    var allStudents = {};
    var allUpdated = JSON.parse(localStorage.getItem("updatedStudents")) || {};
    if(Object.keys(allUpdated).length > 0) {
      allStudents = allUpdated[year][$scope.marks.typeofexam];
    } else {
      allUpdated[year] = {};
      allUpdated[year][$scope.marks.typeofexam] = {};
    }
    allStudents[$scope.marks.studentid+"time"] = $scope.marks.studentid;
    allUpdated[year][$scope.marks.typeofexam] = allStudents;
    localStorage.setItem("updatedStudents", JSON.stringify(allUpdated));
    localStorage.setItem("latestUpdated", JSON.stringify({year:year, typeofexam: $scope.marks.typeofexam}));
    $state.go("app.students", {year: year, typeofexam: $stateParams.typeofexam});
  }
})

.controller('UpdateMarksCtrl', function($scope, $state, $stateParams, AuthenticationService) {
  console.log("State params: ", $stateParams);
  $scope.marks = {};
  var user = JSON.parse(localStorage.getItem("user")) || {};
  $scope.subjects = user.subjects;
  var time = new Date().getTime();
  var localData = JSON.parse(localStorage.getItem('localData')) || {};
  if(localData[$stateParams.studentid]) {
    time = $stateParams.studentid;    
    $scope.marks = localData[$stateParams.studentid];
    console.log("taken data from local:", $scope.marks);
  } else {  
    AuthenticationService.getMarks($stateParams).then(function(studentMarks) {
      console.log("No local data so requested server: ", studentMarks);
      $scope.marks = studentMarks[0];
    });
  }
  $scope.updateMarks = function() {
    console.log("before store: ", $scope.marks);
    if($scope.marks._id) {
      $scope.marks.action = "update";
    }
    localData[time] = $scope.marks;
    localStorage.setItem('localData',  JSON.stringify(localData));
    $state.go("app.students", {year:$stateParams.year, typeofexam: $stateParams.typeofexam});
  }
})

.controller('LoginCtrl', function($scope, $rootScope, $http, $state, $ionicPopup, AuthenticationService) {
  $scope.uid = localStorage.getItem('uid') || '';
  $scope.authenticatedMenu = {"Links":[{"title":"Dashboard", "href":"app.dashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"Marks", "href":"app.marks", "class":"ion-clipboard"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
  $scope.anonymousMenu = {"Links":[{"title":"log-in", "href":"app.home", "class": "ion-log-in"}]};
  if($scope.uid) {
    $scope.authorized = true;
    $scope.menuLinks = $scope.authenticatedMenu;
    localStorage.setItem('processing', 'No');
    $state.go('app.dashboard', {}, {reload: true, inherit: false});
  } else {
    $scope.authorized = false;
    $scope.menuLinks = $scope.anonymousMenu;
  }
  $scope.message = "";
  $scope.doingLogin = false;
  $scope.user = {
    email: '8951572125@school-a.com',
    password: 'RiRualr+mm7mWve0wjNO7Q=='
  };
  $scope.login = function() {
    if(($scope.user.email == null) || ($scope.user.password == null)) {
      alert('Please fill the fields');
    } else {
      $scope.doingLogin = true;
      AuthenticationService.login($scope.user).then(function(data) {

        console.log("End of login :", data);
        $scope.email = null;
        $scope.password = null;
        $scope.authorized = true;
        if(data.role == "hm") {
          $state.transitionTo("app.hmdashboard", null, {'reload': true});
        } else if (data.role == "parent") {
          $state.transitionTo("app.dashboard", null, {'reload': true});
        } else {
          $state.transitionTo("app.dashboard", null, {'reload': true});
        }
      });      
    }
  };
})
.controller('LogoutCtrl', function($scope, $http, $state) {
    delete $http.defaults.headers.common.Authorization;
    console.log("Logging out:");
    localStorage.removeItem('uid');
    //$state.go('app.home', {}, {reload: true});
    $state.go("home", {}, {reload: true});
});