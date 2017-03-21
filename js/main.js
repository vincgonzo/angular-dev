// This is the sample data for this lesson
// app injected dependencies on the project
var app = angular.module('codecraft', [
	'ngResource',
	'infinite-scroll',
	'angularSpinner',
	'jcs-autoValidate',
	'angular-ladda',
	'mgcrea.ngStrap',
	'toastr',
	'ngAnimate',
	'ui.router'
]);

app.config(function($stateProvider, $urlRouterProvider){
	$stateProvider
	.state('list', {
		url: '/',
		templateUrl: 'templates/list.html',
		controller: 'PersonListController'
	})
	.state('edit', {
		url: '/edit/:email',
		templateUrl: 'templates/edit.html',
		controller: 'PersonDetailController'
	});

	$urlRouterProvider.otherwise('/');
});

app.config(function($httpProvider, $resourceProvider, laddaProvider, $datepickerProvider){
	// API Auth key within http service
	$httpProvider.defaults.headers.common['Authorization'] = 'Token f40a7407101e42b4f9c03b004b2881b62eb5a37f';
	$resourceProvider.defaults.stripTrailingSlashes = false;
	// Options to setup ladda buttons
	laddaProvider.setOption({
		style: 'expand-right'
	});
	angular.extend($datepickerProvider.defaults, {
		dateFormat: 'd/M/yyyy',
		autoclose: true
	});
});
// API Update method for API interaction, by default resource doesn't have the UPDATE method
app.factory("Contact", function($resource){
	return $resource("https://api.codecraft.tv/samples/v1/contact/:id/", {id: '@id'}, {
		update : {
			method: 'PUT'
		}
	});
});

app.filter('defaultImage', function(){
	/**
	* The function takes the default values given by obj persons and create that as a input
	* the param is what you add on your filter by written :''
	*/
	return function(input, param){
		if(!input){
			return param;
		}
		return input;
	}
});


app.controller('PersonDetailController', function($scope, $stateParams, $state, ContactService){

	$scope.contacts = ContactService;
	$scope.contacts.selectedPerson = $scope.contacts.getPerson($stateParams.email);

	$scope.save = function(){
		$scope.contacts.updateContact($scope.contacts.selectedPerson).then(function(){
			$state.go("list");
		});
	}
	$scope.remove = function(){
		$scope.contacts.removeContact($scope.contacts.selectedPerson).then(function(){
			$state.go("list");
		});
	}
});

app.controller('PersonListController', function($scope, $modal, ContactService){

	$scope.search = "";
	$scope.order = "email";
	$scope.contacts = ContactService;

	// Loading of contents
	$scope.loadMore = function(){

		// Search for this ????
		console.log("more Please");
		$scope.contacts.loadMore();
	};

	$scope.showCreateModal = function(){
		$scope.contacts.selectedPerson = {};
		$scope.createModal = $modal({
			scope: $scope,
			templateUrl: 'templates/modal.create.tpl.html',
			show: true
		});
	};

	$scope.createContact = function(){
		console.log('Show Modal');
		$scope.contacts.createContact($scope.contacts.selectedPerson)
		.then(function(){
			$scope.createModal.hide();
		});
	};
});

app.service('ContactService', function(Contact, $rootScope, $q, toastr){
	var self = {
		'getPerson': function(email){
			console.log(email);
			for (var i=0; i < self.persons.length; i++){
				var obj = self.persons[i];
				if(obj.email == email){
					return obj;
				}
			}
		},
		'page': 1,
		'hasMore': true,
		'isLoading': false,
		'isSaving': false,
		'isDeleting': false,
		'selectedPerson': null,
		'persons': [],
		'search': null,
		'ordering': 'name',
		'doSearch': function(){
			self.hasMore = true;
			self.page = 1;
			self.persons = [];

			self.loadContacts();
		},
		'doOrder': function(order){
			self.hasMore = true;
			self.page = 1;
			self.persons = [];
			self.loadContacts();
		},
		'loadContacts': function(){
			if(self.hasMore && !self.isLoading){
				self.isLoading = true;

				var params = {
					'page': self.page,
					'search': self.search,
					'ordering': self.ordering
				};

				Contact.get(params, function(data){
					console.log(data);
					angular.forEach(data.results, function(person){
						self.persons.push(new Contact(person));
					})

					if(!data.next){
						self.hasMore = false;
					}
					self.isLoading = false;
				});
			}
		},
		'loadMore': function(){
			if(self.hasMore && !self.isLoading){
				self.page += 1;
				self.loadContacts();
			}
		},
		'updateContact': function(person){
			var d = $q.defer();
			console.log("Service Called Updated");
			self.isSaving = true;
			person.$update().then(function(){
				self.isSaving = false;
				toastr.success('Updated '+ person.name);
				d.resolve();
			});
			return d.promise;
		},
		'removeContact': function(person){
			var d = $q.defer();
			self.isDeleting = true;
			person.$remove().then(function(){
				self.isDeleting = false;
				var index = self.persons.indexOf(person);
				self.persons.splice(index);
				self.selectedPerson = null;
				toastr.success('Removed '+ person.name);
				d.resolve();
			});
			return d.promise;
		},
		'createContact': function(person){
			var d = $q.defer();
			self.isSaving = true;
			Contact.save(person).$promise.then(function(){
				self.isSaving = false;
				self.selectedPerson = null;
				self.hasMore = true;
				self.page = 1;
				self.persons = [];
				self.loadContacts();
				toastr.success('Created '+ person.name);
				d.resolve();
			});
			return d.promise;
		},
		'watchFilters': function(){
			$rootScope.$watch(function(){
				return self.search;
			}, function(newVal){
				if(angular.isDefined(newVal)){
					self.doSearch();
				}
			});

			$rootScope.$watch(function(){
				return self.ordering;
			}, function(newVal){
				if(angular.isDefined(newVal)){
					self.doOrder();
				}
			});
		}
	};

	self.loadContacts();
	self.watchFilters();

	return self;
});
