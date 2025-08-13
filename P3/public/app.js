angular.module('shopApp', [])
.controller('ShopController', ['$http', function($http) {
  var vm = this;
  vm.products = [];
  vm.cart = [];
  vm.searchText = '';
  vm.loading = true;
  vm.error = null;

  // Fetch products from backend API
  $http.get('/api/products')
    .then(function(response) {
      vm.products = response.data;
    })
    .catch(function(err) {
      console.error('Failed to load products:', err);
      vm.error = "Failed to load products. Try again later.";
    })
    .finally(function() {
      vm.loading = false;
    });

  vm.addToCart = function(product) {
    vm.cart.push(product);
  };

  vm.removeFromCart = function(index) {
    vm.cart.splice(index, 1);
  };

  vm.getTotal = function() {
    return vm.cart.reduce(function(total, item) {
      return total + (item.price || 0);
    }, 0);
  };
}]);
