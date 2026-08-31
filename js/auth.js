import { supabase } from './supabase.js';

const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');

function showMessage(message, type = 'error') {
  if (!authMessage) return;
  authMessage.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
  authMessage.classList.add(type === 'success' ? 'bg-green-100' : 'bg-red-100');
  authMessage.classList.add(type === 'success' ? 'text-green-700' : 'text-red-700');
  authMessage.textContent = message;
  authMessage.classList.remove('hidden');
}

async function redirectIfAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = './dashboard.html';
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showMessage('Please provide both email and password.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      showMessage('Login successful. Redirecting...', 'success');
      setTimeout(() => window.location.href = './dashboard.html', 600);
    } catch (error) {
      showMessage(error.message || 'Unable to sign in.');
    }
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = './index.html';
    }
  });
}

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileSidebar = document.getElementById('mobileSidebar');
const closeSidebar = document.getElementById('closeSidebar');

if (mobileMenuBtn && mobileSidebar) {
  mobileMenuBtn.addEventListener('click', () => mobileSidebar.classList.remove('hidden'));
}

if (closeSidebar && mobileSidebar) {
  closeSidebar.addEventListener('click', () => mobileSidebar.classList.add('hidden'));
}

if (mobileSidebar) {
  mobileSidebar.addEventListener('click', (event) => {
    if (event.target === mobileSidebar) {
      mobileSidebar.classList.add('hidden');
    }
  });
}

const userEmail = document.getElementById('userEmail');
if (userEmail) {
  const { data: { user } } = await supabase.auth.getUser();
  userEmail.textContent = user?.email || 'Unknown user';
}

if (window.location.pathname.endsWith('dashboard.html') || window.location.pathname.endsWith('customers.html') || window.location.pathname.endsWith('aircon-units.html') || window.location.pathname.endsWith('services.html')) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = './index.html';
  }
}

redirectIfAuthenticated();
