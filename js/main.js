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


app.controller('PersonDetailController', function($scope, ContactService){
	$scope.contacts = ContactService;

	$scope.save = function(){
		$scope.contacts.updateContact($scope.contacts.selectedPerson);
	}
	$scope.remove = function(){
		$scope.contacts.removeContact($scope.contacts.selectedPerson)
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

	$scope.$watch('search', function(newVal, oldVal){
		if(angular.isDefined(newVal)){
			$scope.contacts.doSearch(newVal);
		}
	});
	$scope.$watch('order', function(newVal, oldVal){
		if(angular.isDefined(newVal)){
			$scope.contacts.doOrder(newVal);
		}
	});
});

app.service('ContactService', function(Contact, $q, toastr){
	var self = {
		'addPerson': function(person){
			this.persons.push(person);
		},
		'page': 1,
		'hasMore': true,
		'isLoading': false,
		'isSaving': false,
		'isDeleting': false,
		'selectedPerson': null,
		'persons': [],
		'search': null,
		'ordering': null,
		'doSearch': function(search){
			self.hasMore = true;
			self.page = 1;
			self.persons = [];
			self.search = search;
			self.loadContacts();
		},
		'doOrder': function(order){
			self.hasMore = true;
			self.page = 1;
			self.persons = [];
			self.ordering = order;
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
			console.log("Service Called Updated");
			self.isSaving = true;
			person.$update().then(function(){
				self.isSaving = false;
				toastr.success('Updated '+ person.name);
			});
		},
		'removeContact': function(person){
			self.isDeleting = true;
			person.$remove().then(function(){
				self.isDeleting = false;
				var index = self.persons.indexOf(person);
				self.persons.splice(index);
				self.selectedPerson = null;
				toastr.success('Removed '+ person.name);
			});
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
		}
	};

	self.loadContacts();

	return self;
});
