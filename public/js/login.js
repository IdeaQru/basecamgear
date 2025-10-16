document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('message');
  
  if (!loginForm) {
    console.error('Form login tidak ditemukan!');
    return;
  }
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous message
    messageDiv.className = '';
    messageDiv.textContent = '';
    
    try {
      const response = await fetch('/login/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        messageDiv.className = 'success';
        messageDiv.textContent = '✅ ' + data.message + ' Redirecting...';
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1000);
      } else {
        messageDiv.className = 'error';
        messageDiv.textContent = '❌ ' + data.message;
      }
    } catch (error) {
      console.error('Login error:', error);
      messageDiv.className = 'error';
      messageDiv.textContent = '❌ Terjadi kesalahan. Coba lagi.';
    }
  });
});
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('message');
  const loginBtn = document.getElementById('loginBtn');
  
  if (!loginForm) {
    console.error('Form login tidak ditemukan!');
    return;
  }
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous message
    messageDiv.className = '';
    messageDiv.textContent = '';
    
    // Add loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    
    try {
      const response = await fetch('/login/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        messageDiv.className = 'success';
        messageDiv.textContent = '✅ ' + data.message + ' Redirecting...';
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1000);
      } else {
        messageDiv.className = 'error';
        messageDiv.textContent = '❌ ' + data.message;
      }
    } catch (error) {
      console.error('Login error:', error);
      messageDiv.className = 'error';
      messageDiv.textContent = '❌ Terjadi kesalahan. Coba lagi.';
    } finally {
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
    }
  });
});

// Toggle password visibility
function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.querySelector('.password-toggle');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.textContent = '🙈';
  } else {
    passwordInput.type = 'password';
    toggleIcon.textContent = '👁️';
  }
}

// Mobile menu toggle
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const toggle = document.querySelector('.mobile-menu-toggle');
  
  if (navLinks && toggle) {
    navLinks.classList.toggle('active');
    toggle.classList.toggle('active');
  }
}

console.log('🔐 Login Page Loaded - Basecamp Gear');
