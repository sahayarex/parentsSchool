angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $stateParams, $cordovaSQLite, $rootScope, $state, MyService) {
  $scope.uid = localStorage.getItem('uid') || '';
  user = JSON.parse(localStorage.getItem('user')) || user;
  $scope.school = user.school;
  if($scope.uid) {
    $scope.authorized = true;
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
    filtersData = JSON.parse(localStorage.getItem('filterdata'));
  } else {
    filtersData.years = user.years;
    filtersData.educationyear = user.years.indexOf(user.educationyear);
    user.typeofexams.unshift("All");
    filtersData.typeofexams = user.typeofexams;
    filtersData.typeofexam = user.typeofexams.indexOf(user.latesttypeofexam);
  }
  localStorage.setItem('filtersData', JSON.stringify(filtersData));
  $rootScope.filtersData = filtersData;
  console.log("CURRENT STATE", $state.current);
  var filterStatus = function(page) {
    $rootScope.noexams = false;
    $rootScope.page = page;
    console.log("dashboard index:", page.indexOf('ashboard'));
    console.log("Page:", page);
    if(page.indexOf('ashboard') > 0) {
        $rootScope.filters = true;
    } else {
        $rootScope.filters = false;
    }
  } 
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
    filterStatus(toState.name);
    if(toState.name == 'app.allclasses') {
/*      location.reload();
$scope.allclasses = true;*/
    }
  })
  filterStatus($state.current.name);
})
.controller('HmDashboardCtrl', function($scope, $rootScope, $state, _, $cordovaSQLite, MyService, $stateParams) {
  var allsubjects = subjectDataPass = subjectDataFail = toppers = [];
  var pass = fail = 0;   
  var gradeData = {};
  $rootScope.hmfilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    $scope.getMarksData();
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  $scope.getMarksData = function() { 
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    if(!params.studentid) {
      params.studentid = "all";
    }
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+'_hm';
    pass = 0;
    fail = 0;
    subjectDataPass = [];
    subjectDataFail = [];
    allsubjects = [];
    var gradeData = {};
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
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
  var processMarksVal = function(v, k, status) {
    if(v.status == "Pass") pass++;
    if(v.status == "Fail") fail++;
    v.marks.forEach(function(mv, mk) {
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
        }
      })
    })
    if(gradeData[v.grade]) {
      gradeData[v.grade] = {name: v.grade, y: parseInt(gradeData[v.grade].y) + 1};
    } else {
      if(v.grade)
        gradeData[v.grade] = {name: v.grade, y: 1};
    }
    if(toppers[v.standard]) {
      if(toppers[v.standard].total < v.total) {
        toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division.toUpperCase(), total: v.total, studentid: v.studentid};
      }
    } else {
      toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division.toUpperCase(), total: v.total, studentid: v.studentid};
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
    var gradeVal = [];
    angular.forEach(gradeData, function(gv, gk) {
      gradeVal.push(gv);
    })
    var passvals = []
    var failvals = []
    angular.forEach(user.subjects, function(us, uk) {
      passvals.push(subjectDataPass[us]);
      failvals.push(subjectDataFail[us]);
    })
    $scope.passfailConfig = {
      chart: {renderTo: 'passfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      plotOptions: {pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [["Pass", pass],["Fail", fail]]}]
    };
    $scope.gradeConfig = {
      chart: {renderTo: 'grades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      plotOptions: {pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: gradeVal}]
    };
    $scope.subjectsConfig = {
      chart: {renderTo: 'subjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      plotOptions: {column: {depth: 25}},
      xAxis: {categories: allsubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: passvals},{name: 'Fail',data: failvals}]
    };
  }
})
.controller('DashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, MyService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.filterResults = function(page) {
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var allsubjects = subjectDataPass = subjectDataFail = toppers = subjectDataMarks = topperSubjects = [];
  var pass = fail = 0;   
  var gradeData = {};
  $scope.getMarksData = function() {
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.standard = user.standard;
    params.division = (user.division) ? user.division : "all";
    if(!params.studentid) {
      params.studentid = "all";
    }
    var tdashparams = localStorage.getItem("DashParam") || '';
    console.log("tdashparams", tdashparams);
    if(tdashparams) {
      var tdashp = tdashparams.split("-");
      var standard = '';
      if(tdashp[0]) {
        params.standard = tdashp[0];
        standard = '_'+tdashp[0];
        $scope.standard = tdashp[0];
      }
      var division = '_all';
      if(tdashp[1]) {
        params.division = tdashp[1];
        division = '_'+tdashp[1];
        $scope.division = tdashp[1];
      }    
    }
    $scope.title = params.standard +'/'+params.division+' Dashboard';
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+standard+division;
    pass = 0;
    fail = 0;
    subjectDataPass = [];
    subjectDataFail = [];
    allsubjects = [];
    subjectDataMarks = [];       
    toppers = [];
    topperSubjects = [];
    var gradeData = {};
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
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
          console.log("its empty");
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
  var processMarksVal = function(v, k, status) {
    if(v.status == "Pass") pass++;
    if(v.status == "Fail") fail++;
    v.marks.forEach(function(mv, mk) {
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
        }
      })
    })
    if(gradeData[v.grade]) {
      gradeData[v.grade] = {name: v.grade, y: parseInt(gradeData[v.grade].y) + 1};
    } else {
      if(v.grade)
        gradeData[v.grade] = {name: v.grade, y: 1};
    }
    if(toppers[v.standard]) {
      if(toppers[v.standard].total < v.total) {
        toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division.toUpperCase(), total: v.total};
      }
    } else {
      toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division.toUpperCase(), total: v.total};
    }
  }
  var applyMarks = function() {
    $scope.tpassfailConfig = {};
    var gradeVal = [];
    angular.forEach(gradeData, function(gv, gk) {
      gradeVal.push(gv);
    })
    var passvals = [];
    var failvals = [];
    var topperS = [];
    angular.forEach(allsubjects, function(us, uk) {
      passvals.push(subjectDataPass[us]);
      failvals.push(subjectDataFail[us]);
      if(topperSubjects[us]) {
        topperS.push(topperSubjects[us]);
      } else {
        topperS.push({total:0, student:"", subject: us, classd: ""});
      }
    })
    $scope.tpassfailConfig = {
      chart: {renderTo: 'tpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      plotOptions: {pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [["Pass", pass],["Fail", fail]]}]
    };
    $scope.tgradeConfig = {
      chart: {renderTo: 'tgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      plotOptions: {pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: gradeVal}]
    };
    $scope.tsubjectsConfig = {
      chart: {renderTo: 'tsubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      plotOptions: {column: {depth: 25}},
      xAxis: {categories: allsubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: passvals},{name: 'Fail',data: failvals}]
    };    
    var toppersList = [];
    _.each(toppers, function(v, k) {
      if(v) {
        toppersList.push(v);
      }
    });
    $scope.toppers = toppersList;
    $scope.subjectToppers = topperS;
  }
  $scope.getMarksData();

})
.controller('AllClassesCtrl', function($scope, $rootScope, $cordovaSQLite, MyService, $ionicHistory) {
  var processUsers = function(users) {
    $ionicHistory.clearHistory();
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
    if(MyService.online()) {
      MyService.getUsers(params).then(function(users) {
        if(users.length > 0) {
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
.controller('AllStudentsCtrl', function($scope, $stateParams, $rootScope, $cordovaSQLite, MyService) {
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
    if(MyService.online()) {
      MyService.getUsers(params).then(function(users) {
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
.controller('StudentDashboardCtrl', function($scope, $rootScope, $cordovaSQLite, $state, $stateParams, $ionicSideMenuDelegate, MyService) {
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
    var sdashparams = localStorage.getItem("DashParam") || '';
    console.log("sdashparams", sdashparams);
    if(sdashparams) {
      params.studentid = sdashparams;
    }    
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+params.studentid;
    subjectMarks = [];
    subjectLabels = []; 
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
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
          console.log("no marks");
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
    v.marks.forEach(function(mv, mk) {
      angular.forEach(mv, function(mvv, mkk) {
        if((mkk != "status")) {
          subjectLabels.push(mkk);
          subjectMarks.push(mvv);
        }
      })
    })
    $scope.ssubjectsConfig = {
      chart: {renderTo: 'ssubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      plotOptions: {column: {depth: 25}},
      xAxis: {categories: subjectLabels},
      yAxis: {title: {text: null}},
      series: [{name: 'Marks',data: subjectMarks}]
    };
    if(v.attendance) {
      var att = v.attendance.split("/");
      $scope.sattendanceConfig = {
      chart: {renderTo: 'sattendance',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      plotOptions: {pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [['Present', parseInt(att[0])],['Absent', parseInt(att[1]) - parseInt(att[0])]]}]
      };
    }
    $scope.mark = v;
  }
})
.controller('StudentOverallDashboardCtrl', function($scope, $rootScope, $stateParams, $cordovaSQLite, MyService) {
    var examLabels = examMarks = examGrades = allsubjects = attendance = [];
    var subjectDataMarks = {};
    var student = '';
    $rootScope.noexams = true;
  $rootScope.overallFilterResults = function(page) {
    console.log("Filtersdata", $rootScope.filtersData);
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
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
    var dashparam = localStorage.getItem("DashParam") || '';
    console.log("dashparam", dashparam);
    if(dashparam) {
      params.studentid = dashparam;
    }    
/*    if($stateParams.studentid) {
      params.studentid = $stateParams.studentid;
      params.typeofexam = "all";
      dbkey += '_'+$stateParams.studentid;
    }*/
    if(!params.studentid) {
      params.studentid = "all";
    }
    console.log("params", params);
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
            examLabels = [];
            examMarks = [];
            examGrades = [];
            eachData = [];
            subjectDataMarks = {};
            student = '';
            attendance = [];
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
  var processMarksVal = function(v, k, status) {
    examLabels.push(v.typeofexam);
    examMarks.push({name: v.typeofexam, y: v.percentage});
    attendance.push(v.attendanceP);
    v.marks.forEach(function(mv, mk) {
      angular.forEach(mv, function(mvv, mkk) {
        if((mkk != "status")) {
          if(allsubjects.indexOf(mkk) == -1) {
            allsubjects.push(mkk);
          }
          if(!subjectDataMarks[mkk])
            subjectDataMarks[mkk] = [];
          subjectDataMarks[mkk].push({name: mkk, y:parseInt(mvv)});
        }
      })
    })
    student = v.student;
  }
  var applyMarks = function() {
    $scope.title = student;
    $scope.somarksConfig = {
      chart: {renderTo: 'somarks',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      plotOptions: {column: {depth: 25},allowPointSelect: false},
      xAxis: {categories: examLabels},
      yAxis: {title: {text: null}},
      series: [{name: 'Marks',data: examMarks}]
    };
    var allsubjectData = [];
    allsubjects.forEach(function(sv, sk) {
      allsubjectData.push({name: sv, data: subjectDataMarks[sv]});
    })
    console.log("examLabels", examLabels);
    console.log("subjectDataMarks", subjectDataMarks);
    console.log("attendance", attendance);
    $scope.sosubjectsConfig = {
      chart: {renderTo: 'sosubjects',type: 'areaspline', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      plotOptions: {column: {depth: 25}},
      xAxis: {categories: examLabels},
      yAxis: {title: {text: null}},
      series: allsubjectData
    };
    $scope.soattendanceConfig = {
      chart: {renderTo: 'soattendance',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      plotOptions: {column: {depth: 25},allowPointSelect: false},
      xAxis: {categories: examLabels},
      yAxis: {title: {text: null}},
      series: [{name: 'Attendance',data: attendance}]
    };    
/*    $scope.allsubjects = allsubjects;
    $scope.subjectMarks = subjectDataMarks;
    $scope.attendanceVal = [attendance];*/
  }
})
.controller('StudentProfileCtrl', function($scope, $rootScope, $cordovaSQLite, MyService, $stateParams) {
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
    if(MyService.online()) {
      console.log("GGGGGGGGGGGG", params);
      MyService.getUsers(params).then(function(users) {
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
.controller('ClassProfileCtrl', function($scope, $rootScope, $cordovaSQLite, MyService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  var classData = {};
  $scope.getStudentsData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += "_"+$stateParams.standard;
      $scope.standard = $stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += "_"+$stateParams.division;
      $scope.division = $stateParams.division;
    }
    if($stateParams.studentid) {
      params._id = $stateParams.studentid;
      dbkey += "_"+$stateParams.studentid;
    }
    $scope.title = $stateParams.standard + '/'+$stateParams.division +' Profile';
    if(MyService.online()) {
      MyService.getUsers(params).then(function(allusers) {
        console.log("Got all users:", allusers);
        if(allusers.length > 0) {
          $scope.allClasses = true;
          classData = {};
          angular.forEach(allusers, function(v,k) {
            processMarksVal(v, k, "online");
          })
          classData.total = allusers.length;
          console.log("classData", classData);
          $scope.classData = classData;
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
          $scope.allStudents = true;
          angular.forEach(allusers, function(v,k) {
            processMarksVal(v, k, "online");
          })
          classData.total = totalrecords;
          console.log("classData", classData);
          $scope.classData = classData;
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
  var processMarksVal = function(v, k, status) {
    classData.teacher = v.teacher;
    if(!classData.male) classData.male = 0;
    classData.male = (v.sex.toLowerCase() == "male") ? classData.male + 1 : classData.male;
    if(!classData.female) classData.female = 0;
    classData.female = (v.sex.toLowerCase() == "female") ? classData.female + 1 : classData.female;
    if(!classData.allstudent) classData.allstudents = [];
    classData.allstudents.push({name: v.name, studentid: v._id});
  }
})
.controller('LoginCtrl', function($scope, $rootScope, $http, $state, $ionicPopup, MyService) {
  $scope.message = "";
  $scope.doingLogin = false;
  $scope.user = {
    email: '8951572125@school-a.com',
    password: '8Bu1+XUwxvFfqjZCB+8blg=='
  };
  $scope.login = function() {
    if(($scope.user.email == null) || ($scope.user.password == null)) {
      alert('Please fill the fields');
    } else {
      $scope.doingLogin = true;
      MyService.login($scope.user).then(function(data) {

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
    $state.go("home", {}, {reload: true});
});
