// js/auth.js
import { supabase } from './supabase.js';

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('authMessage');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailDisplay = document.getElementById('userEmail');

// 1. Check Auth State on Page Load
async function checkAuth() {
  // Hide the form entirely while checking so the user can't interact with it
  if (loginForm) {
      loginForm.style.display = 'none'; 
  }

  try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const currentPage = window.location.pathname;
      const isLoginPage = currentPage.endsWith('login.html') || currentPage.endsWith('index.html') || currentPage === '/' || currentPage.endsWith('5500/');

      if (session) {
        if (isLoginPage) {
          window.location.replace('dashboard.html'); // Use replace to prevent "Back" button loops
          return;
        }
        if (userEmailDisplay) {
          userEmailDisplay.textContent = session.user.email;
        }
      } else {
        // Only show the form AFTER we confirm there is no active session
        if (loginForm) {
            loginForm.style.display = 'block'; 
        }
        
        if (!isLoginPage) {
          window.location.replace('index.html');
        }
      }
  } catch (err) {
      console.error("Auth check failed:", err);
      if (loginForm) loginForm.style.display = 'block'; 
  }
}

// 2. Handle Login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      authMessage.textContent = error.message;
      authMessage.classList.remove('hidden', 'bg-teal-100', 'text-teal-800');
      authMessage.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-200');
      
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    } else {
      window.location.replace('dashboard.html');
    }
  });
}

// 3. Handle Bulletproof Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Visual feedback so you know the click actually registered
    logoutBtn.textContent = 'Logging out...';
    logoutBtn.disabled = true;
    
    try {
        await supabase.auth.signOut();
        
        // Nuke local storage entirely to prevent "zombie" sessions
        localStorage.clear();
        sessionStorage.clear();
        
        window.location.replace('index.html');
    } catch (error) {
        console.error("Logout error:", error);
        alert("There was an issue logging out. Please manually refresh.");
        logoutBtn.textContent = 'Logout';
        logoutBtn.disabled = false;
    }
  });
}

// Initialize Auth Check
checkAuth();