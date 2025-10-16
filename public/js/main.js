// ==================== CUSTOM CURSOR EFFECT ====================
document.addEventListener('DOMContentLoaded', function() {
  
  // Create custom cursor elements
  const cursor = document.createElement('div');
  const cursorFollower = document.createElement('div');
  
  cursor.classList.add('custom-cursor');
  cursorFollower.classList.add('custom-cursor-follower');
  
  document.body.appendChild(cursor);
  document.body.appendChild(cursorFollower);
  
  let mouseX = 0;
  let mouseY = 0;
  let followerX = 0;
  let followerY = 0;
  
  // Update cursor position on mouse move
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });
  
  // Smooth follower animation
  function animateFollower() {
    const speed = 0.15;
    
    followerX += (mouseX - followerX) * speed;
    followerY += (mouseY - followerY) * speed;
    
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
    
    requestAnimationFrame(animateFollower);
  }
  
  animateFollower();
  
  // Cursor hover effects
  const hoverElements = document.querySelectorAll('a, button, .cta, .feature-card, .destination-card, .slider-btn, .nav-links a');
  
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('cursor-hover');
      cursorFollower.classList.add('cursor-hover');
    });
    
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('cursor-hover');
      cursorFollower.classList.remove('cursor-hover');
    });
  });
  
  // Cursor click effect
  document.addEventListener('mousedown', () => {
    cursor.classList.add('cursor-click');
    cursorFollower.classList.add('cursor-click');
  });
  
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('cursor-click');
    cursorFollower.classList.remove('cursor-click');
  });
  
  // Hide default cursor on desktop
  if (window.innerWidth > 768) {
    document.body.style.cursor = 'none';
    
    // Add cursor class to all interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select');
    interactiveElements.forEach(el => {
      el.style.cursor = 'none';
    });
  }
  
  // Trail effect particles
  const particles = [];
  const maxParticles = 20;
  
  document.addEventListener('mousemove', (e) => {
    if (particles.length < maxParticles) {
      createParticle(e.clientX, e.clientY);
    }
  });
  
  function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.classList.add('cursor-particle');
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    document.body.appendChild(particle);
    
    particles.push(particle);
    
    setTimeout(() => {
      particle.remove();
      particles.shift();
    }, 600);
  }
});

// ==================== MOBILE MENU TOGGLE ====================
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const icon = mobileBtn.querySelector('i');
  
  navLinks.classList.toggle('active');
  
  // Toggle icon
  if (navLinks.classList.contains('active')) {
    icon.classList.remove('fa-bars');
    icon.classList.add('fa-times');
  } else {
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
  }
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const icon = mobileBtn.querySelector('i');
    
    if (navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });
});

// ==================== BACK TO TOP BUTTON ====================
window.addEventListener('scroll', function() {
  const backToTop = document.querySelector('.back-to-top');
  
  if (window.scrollY > 300) {
    backToTop.classList.add('show');
  } else {
    backToTop.classList.remove('show');
  }
  
  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 100) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// ==================== SMOOTH SCROLL FOR ANCHOR LINKS ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    
    // Skip if href is just "#"
    if (href === '#') {
      e.preventDefault();
      return;
    }
    
    if (href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  });
});

// ==================== SCROLL INDICATOR HIDE ON SCROLL ====================
window.addEventListener('scroll', function() {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  
  if (scrollIndicator) {
    if (window.scrollY > 100) {
      scrollIndicator.style.opacity = '0';
      scrollIndicator.style.pointerEvents = 'none';
    } else {
      scrollIndicator.style.opacity = '1';
      scrollIndicator.style.pointerEvents = 'auto';
    }
  }
});

// ==================== INTERSECTION OBSERVER FOR ANIMATIONS ====================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.slide-up, .zoom-in, .fade-in').forEach(el => {
  observer.observe(el);
});

// ==================== PARALLAX EFFECT ====================
window.addEventListener('scroll', function() {
  const scrolled = window.pageYOffset;
  
  // Parallax for hero section
  const heroOverlay = document.querySelector('.hero-overlay');
  if (heroOverlay) {
    heroOverlay.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
  
  // Parallax for stats
  const stats = document.querySelectorAll('.stat-item');
  stats.forEach((stat, index) => {
    const speed = 0.3 + (index * 0.1);
    stat.style.transform = `translateY(${scrolled * speed * 0.1}px)`;
  });
});

// ==================== COUNTER ANIMATION ====================
function animateCounter(element, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16);
  
  const counter = setInterval(() => {
    start += increment;
    
    if (start >= target) {
      element.textContent = target;
      clearInterval(counter);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

// Trigger counter animation when stats are visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
      entry.target.classList.add('counted');
      
      const strong = entry.target.querySelector('strong');
      const text = strong.textContent;
      const number = parseInt(text.replace(/\D/g, ''));
      
      if (number) {
        strong.textContent = '0';
        animateCounter(strong, number);
      }
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
  statsObserver.observe(stat);
});

// ==================== LAZY LOADING IMAGES ====================
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ==================== TYPED TEXT EFFECT ====================
function typeWriter(element, text, speed = 100) {
  let i = 0;
  element.textContent = '';
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// ==================== TILT EFFECT ON CARDS ====================
const cards = document.querySelectorAll('.feature-card, .destination-card');

cards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  });
});

// ==================== PREVENT ANIMATIONS ON PAGE LOAD ====================
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// ==================== SCROLL PROGRESS BAR ====================
const progressBar = document.createElement('div');
progressBar.classList.add('scroll-progress');
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (window.scrollY / windowHeight) * 100;
  progressBar.style.width = scrolled + '%';
});

// ==================== CONSOLE MESSAGE ====================
console.log('%c🏔️ Basecamp Gear', 'font-size: 24px; font-weight: bold; color: #fee3a2; background: #755848; padding: 10px 20px; border-radius: 5px;');
console.log('%cRental Alat Outdoor Terpercaya di Banyuwangi', 'font-size: 14px; color: #8d735a;');
console.log('%c📞 WhatsApp: 083 131 251 615', 'font-size: 12px; color: #25D366;');

// ==================== DISABLE RIGHT CLICK (OPTIONAL) ====================
// Uncomment if you want to protect images
/*
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
  }
});
*/

// ==================== EASTER EGG ====================
let clickCount = 0;
const logo = document.querySelector('.logo-container');

if (logo) {
  logo.addEventListener('click', () => {
    clickCount++;
    
    if (clickCount >= 5) {
      logo.style.animation = 'rotate 1s ease-in-out';
      
      setTimeout(() => {
        logo.style.animation = '';
        clickCount = 0;
      }, 1000);
    }
  });
}
