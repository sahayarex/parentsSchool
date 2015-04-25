'use strict';

describe('Controller: AddDataCtrl', function () {

  // load the controller's module
  beforeEach(module('schoolServerApp'));

  var AddDataCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddDataCtrl = $controller('AddDataCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
