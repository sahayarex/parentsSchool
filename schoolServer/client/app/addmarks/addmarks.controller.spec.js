'use strict';

describe('Controller: AddmarksCtrl', function () {

  // load the controller's module
  beforeEach(module('schoolServerApp'));

  var AddmarksCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddmarksCtrl = $controller('AddmarksCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
