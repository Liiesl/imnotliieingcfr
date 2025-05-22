// scripts/firebase-auth.js
let auth;

// Initialize Firebase and set up auth state listener
function initializeAuth() {
  return fetch('/getFirebaseConfig')
    .then(response => response.json())
    .then(firebaseConfig => {
      // Check if Firebase is already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      auth = firebase.auth();
      setupAuthStateListener();
      return auth;
    })
    .catch(error => {
      console.error('Failed to load firebase config:', error);
    });
}

// Set up auth state listener
function setupAuthStateListener() {
  auth.onAuthStateChanged((user) => {
    updateAuthButtons(user);
  });
}

// Update auth buttons visibility
function updateAuthButtons(user) {
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');

  if (!loginButton || !logoutButton) {
    console.warn('Auth buttons not found in the DOM');
    return;
  }

  if (user) {
    if (user.emailVerified) {
      loginButton.style.display = 'none';
      logoutButton.style.display = 'block';
    } else {
      alert('Please verify your email address to activate your account.');
      auth.signOut();
    }
  } else {
    loginButton.style.display = 'block';
    logoutButton.style.display = 'none';
  }
}

// Wait for the DOM to be fully loaded before initializing auth
document.addEventListener('DOMContentLoaded', () => {
  initializeAuth();
});

export { auth, updateAuthButtons };