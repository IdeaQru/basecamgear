let currentSlideIndex = 1;
let autoSlideInterval;

// Show slide
function showSlide(n) {
  const slides = document.getElementsByClassName('slide');
  const dots = document.getElementsByClassName('dot');
  
  if (n > slides.length) {
    currentSlideIndex = 1;
  }
  if (n < 1) {
    currentSlideIndex = slides.length;
  }
  
  // Hide all slides
  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove('active');
  }
  
  // Remove active class from all dots
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove('active');
  }
  
  // Show current slide
  slides[currentSlideIndex - 1].classList.add('active');
  dots[currentSlideIndex - 1].classList.add('active');
}

// Next/previous controls
function changeSlide(n) {
  showSlide(currentSlideIndex += n);
  
  // Reset auto slide timer
  clearInterval(autoSlideInterval);
  startAutoSlide();
}

// Dot controls
function currentSlide(n) {
  showSlide(currentSlideIndex = n);
  
  // Reset auto slide timer
  clearInterval(autoSlideInterval);
  startAutoSlide();
}

// Auto slide every 5 seconds
function startAutoSlide() {
  autoSlideInterval = setInterval(() => {
    currentSlideIndex++;
    showSlide(currentSlideIndex);
  }, 5000);
}

// Initialize slider
document.addEventListener('DOMContentLoaded', () => {
  showSlide(currentSlideIndex);
  startAutoSlide();
  
  // Pause auto slide on hover
  const sliderContainer = document.querySelector('.slider-container');
  if (sliderContainer) {
    sliderContainer.addEventListener('mouseenter', () => {
      clearInterval(autoSlideInterval);
    });
    
    sliderContainer.addEventListener('mouseleave', () => {
      startAutoSlide();
    });
  }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    changeSlide(-1);
  } else if (e.key === 'ArrowRight') {
    changeSlide(1);
  }
});
