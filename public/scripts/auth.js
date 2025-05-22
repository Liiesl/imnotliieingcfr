// scripts/auth.js
import { auth } from './firebase-auth.js';

async function signIn() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Check if the user's email is verified
    if (user.emailVerified) {
      alert('Login successful!');
      window.location.href = '/'; // Redirect to home page
    } else {
      // If email is not verified, sign out the user and prompt them to verify their email
      await auth.signOut();
      alert('Please verify your email address before logging in. Check your inbox for the verification link.');
    }
  } catch (error) {
    console.error('Error during sign-in:', error);
    alert(error.message);
  }
}

async function signUp() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const confirmPassword = document.getElementById('auth-password-confirm').value;

  if (!email || !password || !confirmPassword) {
    alert('Please fill in all fields.');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Send email verification
    await user.sendEmailVerification();
    alert('Account created! Please check your email to activate your account.');

    // Redirect to home page or login page
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Error during sign-up:', error);
    alert(error.message);
  }
}


function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      alert('Login successful!');
      window.location.href = '/'; // Redirect to home page
    })
    .catch((error) => {
      console.error('Error during Google sign-in:', error);
      alert(error.message);
    });
}

function signOut() {
  const modal = document.getElementById('logout-modal');
  const confirmLogout = document.getElementById('confirm-logout');
  const cancelLogout = document.getElementById('cancel-logout');

  if (!modal || !confirmLogout || !cancelLogout) {
    console.error('Modal or buttons not found in the DOM');
    return;
  }

  // Show the modal
  modal.style.display = 'flex';

  // Handle confirm logout
  confirmLogout.onclick = () => {
    auth.signOut()
      .then(() => {
        alert('Logged out!');
        window.location.href = '/'; // Redirect to home page
      })
      .catch((error) => {
        console.error('Error during sign-out:', error);
        alert(error.message);
      })
      .finally(() => {
        modal.style.display = 'none'; // Hide the modal
      });
  };

  // Handle cancel logout
  cancelLogout.onclick = () => {
    modal.style.display = 'none'; // Hide the modal
  };
}

function togglePassword(fieldId) {
  const passwordField = document.getElementById(fieldId);
  const toggleIcon = passwordField.nextElementSibling.nextElementSibling;

  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    passwordField.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
}

// Attach the function to the window object
window.togglePassword = togglePassword;


// Attach functions to the window object
window.signIn = signIn;
window.signUp = signUp;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;

// Ensure the DOM is fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.onclick = signOut;
  }
});