angular.module('authApp', [])
  .controller('AuthController', function($scope, $http) {
    const API_URL = 'http://localhost:5000/api';

    $scope.signupData = {};
    $scope.loginData = {};
    $scope.profile = null;
    $scope.isLoggedIn = false;
    $scope.signupError = '';
    $scope.signupSuccess = '';
    $scope.loginError = '';

    // Save token in localStorage
    function saveToken(token) {
      localStorage.setItem('authToken', token);
    }

    // Get token from localStorage
    function getToken() {
      return localStorage.getItem('authToken');
    }

    // Remove token on logout
    function removeToken() {
      localStorage.removeItem('authToken');
    }

    // Signup function
    $scope.signup = function() {
      $scope.signupError = '';
      $scope.signupSuccess = '';
      $http.post(`${API_URL}/signup`, $scope.signupData)
        .then(res => {
          $scope.signupSuccess = res.data.message;
          $scope.signupData = {};
        })
        .catch(err => {
          $scope.signupError = err.data.message || 'Signup failed';
        });
    };

    // Login function
    $scope.login = function() {
      $scope.loginError = '';
      $http.post(`${API_URL}/login`, $scope.loginData)
        .then(res => {
          saveToken(res.data.token);
          $scope.isLoggedIn = true;
          $scope.loginData = {};
          $scope.getProfile();
        })
        .catch(err => {
          $scope.loginError = err.data.message || 'Login failed';
        });
    };

    // Get profile function
    $scope.getProfile = function() {
      const token = getToken();
      if (!token) return;

      $http.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        $scope.profile = res.data.user;
      })
      .catch(() => {
        // Token invalid or expired
        $scope.logout();
      });
    };

    // Logout function
    $scope.logout = function() {
      removeToken();
      $scope.isLoggedIn = false;
      $scope.profile = null;
    };

    // On page load check token & get profile if token exists
    if (getToken()) {
      $scope.isLoggedIn = true;
      $scope.getProfile();
    }
  });
