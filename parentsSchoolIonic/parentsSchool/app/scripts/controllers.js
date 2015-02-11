angular.module('parentsSchool.controllers', ['parentsSchool.services'])

.controller('AppCtrl', function($scope, $state, AuthenticationService) {
  $scope.uid = localStorage.getItem('uid') || '';
  $scope.savingSiteDetails = false; 
  $scope.authenticatedMenu = {"Links":[{"title":"Create Page", "href":"app.createPage"},{"title":"Pages", "href":"app.pages"},{"title":"log-out", "href":"app.logout"}]};                            
  $scope.anonymousMenu = {"Links":[{"title":"log-in", "href":"app.home"}]};
  console.log('uid', $scope.uid); 
  if($scope.uid) {
    $scope.authorized = true;
    $scope.menuLinks = $scope.authenticatedMenu;
    localStorage.setItem('processing', 'No');
    $state.go('app.pages');
  } else {
    $scope.authorized = false;
    $scope.menuLinks = $scope.anonymousMenu;
  }

  //Sync online
  setInterval(function() {
    var processing = localStorage.getItem('processing');
    if(processing != 'Yes') {
      if(AuthenticationService.online()) {
        var localData = JSON.parse(localStorage.getItem('localData')) || {};
        if(Object.keys(localData).length > 0) {
          angular.forEach(localData, function(monitor, key) {
            if(monitor.serverUpdate != 1) {
              localStorage.setItem('processing', 'Yes');
              if(Object.keys(monitor.pictures).length > 0) {
                AuthenticationService.savePhotoNodeInServer(monitor, key).then(function(data) {
                    monitor.serverUpdate = 1;
                    localData[key] = monitor;
                    localStorage.setItem('localData', JSON.stringify(localData));
                    localStorage.setItem('processing', 'No');
                    $state.go($state.current, {}, {reload: true});  
                });
              } else {
                AuthenticationService.saveNodeInServer(monitor, key).then(function(data) {
                  monitor.serverUpdate = 1;
                  monitor.nid = data.nid;
                  localData[key] = monitor;
                  localStorage.setItem('localData', JSON.stringify(localData));
                  localStorage.setItem('processing', 'No');
                  console.log('localData', localData);
                  $state.go($state.current, {}, {reload: true});  
                });
              }
            }
          })
        }
      }
    }
  }, 5000);
})
  
.controller('LoginCtrl', function($scope, $http, $state, AuthenticationService) {
  $scope.message = "";
  $scope.doingLogin = false;
  $scope.user = {
    email: 'admin@admin.com',
    password: 'admin'
  };
 
  $scope.login = function() {
    if(($scope.user.email == null) || ($scope.user.password == null)) {
      alert('Please fill the fields');
    } else {
      $scope.doingLogin = true;
      AuthenticationService.login($scope.user);
    }
  };
  
  $scope.logout = function() {
    AuthenticationService.logout();
  };
 
  $scope.$on('event:auth-loginRequired', function(e, rejection) {
    //$scope.loginModal.show();
  });
 
  $scope.$on('event:auth-loginConfirmed', function() {
    $scope.email = null;
    $scope.password = null;
    $scope.authorized = true;
    $scope.menuLinks = $scope.authenticatedMenu;
    $state.go('app.pages', {}, {reload: true});
  });
  
  $scope.$on('event:auth-login-failed', function(e, status) {
    $scope.doingLogin = false;
    $scope.user.email = '';
    $scope.user.password = '';
  });
 
  $scope.$on('event:auth-logout-complete', function() {
    localStorage.removeItem('uid');
    localStorage.removeItem('userPages'+$scope.uid);
    localStorage.removeItem('localData');
    $state.go('app.home', {}, {reload: true, inherit: false});
  });    
})
 
.controller('HomeCtrl', function($scope, $ionicViewService) {
  $ionicViewService.clearHistory();
})

.controller('LogoutCtrl', function($scope, $state) {
  localStorage.removeItem('uid');
  $state.go('app.home', {}, {reload: true, inherit: false});

})


.controller('PagesCtrl', function($scope, $state, AuthenticationService) {
 
  $scope.gettingData = true;
  $scope.emptyResults = false;


  var allData = function() {
    if(AuthenticationService.online()) {
      var param = {"uid":$scope.uid, "type":"drupalionic"}
      AuthenticationService.getNodes(param).then(function(data) {
        console.log(data.nodes);
          if(data.nodes != null || data.nodes != undefined) {
            $scope.gettingData = false;
            $scope.pages = data.nodes;
          } else {
            $scope.emptyResults = true;
          }
          $scope.$broadcast('scroll.refreshComplete');
          localStorage.setItem('userData'+$scope.uid, JSON.stringify(data.nodes));
      });
    } else {
      var userData = JSON.parse(localStorage.getItem('userData'+$scope.uid)) || {};            $scope.gettingData = false;
      if(Object.keys(userData).length > 0) {
        $scope.gettingData = false;
        $scope.pages = userData;
      } else {
        $scope.emptyResults = true;
      }
    }
  }

  $scope.getData = function() {
    allData();
  }

  $scope.remove = function(nid) {
    if(AuthenticationService.online()) {
      var userData = JSON.parse(localStorage.getItem('userData'+$scope.uid)) || {};            $scope.gettingData = false;
      var node = userData[nid];
      console.log('node', node);
      if(node.nid) {
        AuthenticationService.removeNodeInServer(node.nid).then(function(data) {
          delete userData[nid];
          localStorage.setItem('userData'+$scope.uid, JSON.stringify(userData));
          allData();
        });
      } else {
        delete userData[nid];
        localStorage.setItem('userData', JSON.stringify(userData));
        allData();
      }
    } else {      
      delete userData[nid];
      localStorage.setItem('userData', JSON.stringify(userData));
      allData();
    }
  }

})

.controller('PageCtrl', function($scope, $state, $stateParams, AuthenticationService) {
  var pages = JSON.parse(localStorage.getItem('userData'+$scope.uid)) || {};
  console.log('pages', pages.nodes);
  if(Object.keys(pages).length > 0) {
    $scope.page = pages.nodes[$stateParams.pageId];
    $scope.nid = $stateParams.pageId;
    console.log($scope.page);
  }

})

.controller('CreatePageCtrl', function($scope, $state, $stateParams, AuthenticationService) {
  $scope.page = {};
  $scope.page.uid = $scope.uid;
  $scope.page.nid = '';
  $scope.page.type = 'drupalionic';
  $scope.page.serverUpdate = 0;
  //We store the values in local and sync the data
  //In this way we can let the users submit data offline.
  $scope.createPage = function() {
    var localData = JSON.parse(localStorage.getItem('localData')) || {};
    var time = new Date().getTime();
    console.log('page', $scope.page);  
    localData[time] = $scope.page;
    localStorage.setItem('localData', JSON.stringify(localData));
    $state.go('app.pages');    
  }

  $scope.page.pictures = {};
  $scope.allPhotos = [];
  $scope.pictureIndex = 1;
  $scope.takePhotoDisabled = false;
  $scope.takePicture = function(pictureIndex) {
    var options =   {
      quality: 75,
      destinationType: 1,
      sourceType: 1,      
      encodingType: 0,
      targetWidth: 320,
      targetHeight: 320
    }
    navigator.camera.getPicture(function(imageURI) {
      $scope.page.pictures[$scope.pictureIndex] = imageURI;
      $scope.allPhotos[$scope.pictureIndex] = imageURI;
      $scope.pictureIndex++;
      $scope.$apply();
    }, function(err) {
      console.err(err);
    }, options);    
  }

  $scope.browsePicture = function(pictureIndex) {
    var options =   {
      quality: 75,    
      maximumImagesCount: 10,  
      width: 320,
      height: 320
    }
    $scope.takePhotoDisabled = true;
    window.imagePicker.getPictures(
      function(results) {
          for (var i = 0; i < results.length; i++) {
              $scope.page.pictures[$scope.pictureIndex] = results[i];
              $scope.allPhotos[$scope.pictureIndex] = results[i];
              $scope.pictureIndex++;
          }
          $scope.takePhotoDisabled = false;
          $scope.$apply();
      }, function (error) {
          console.log('Error: ' + error);
      }, options);      
  }

})