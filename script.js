// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });
});

// Header scroll effect and mobile menu handling
const header = document.querySelector('header');
let lastScroll = 0;

function closeMobileMenuAndDropdown() {
  const mobileMenu = document.getElementById('mobileMenu');
  const menuButton = document.getElementById('menuButton');
  const mobileLangDropdown = document.getElementById('mobileLangDropdown');

  if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
    mobileMenu.classList.add('hidden');
    const icon = menuButton.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');

    if (mobileLangDropdown) {
      mobileLangDropdown.classList.add('hidden');
    }
  }
}

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > lastScroll && currentScroll > 100) {
    // Scrolling down
    header.style.transform = 'translateY(-100%)';
    closeMobileMenuAndDropdown();
  } else {
    // Scrolling up
    header.style.transform = 'translateY(0)';
    closeMobileMenuAndDropdown();
  }

  lastScroll = currentScroll;
});

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Show error message under an input field
function showInputError(input, message) {
  // Remove any existing error message
  const existingError = input.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  // Create and add new error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message text-red-500 text-sm mt-1';
  errorDiv.textContent = message;
  input.parentElement.appendChild(errorDiv);
  input.classList.add('border-red-500');
}

// Clear error message and styling
function clearInputError(input) {
  const errorMessage = input.parentElement.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
  input.classList.remove('border-red-500');
}

// Form submission handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  // Add real-time email validation
  const emailInput = contactForm.querySelector('input[name="email"]');
  emailInput.addEventListener('input', function() {
    if (this.value && !isValidEmail(this.value)) {
      showInputError(this, 'Please enter a valid email address');
    } else {
      clearInputError(this);
    }
  });

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    // Get form values
    const formData = new FormData(this);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };

    // Validate email before submission
    if (!isValidEmail(data.email)) {
      showInputError(emailInput, 'Please enter a valid email address');
      return;
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    submitButton.style.backgroundColor = '#666';

    // Send to Cloud Function
    fetch('https://us-central1-turing-mark-444500-q4.cloudfunctions.net/handleFormSubmission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(() => {
        // Show success message
        submitButton.textContent = 'Message Sent!';
        submitButton.style.backgroundColor = '#28a745';

        // Reset form and clear any error messages
        this.reset();
        clearInputError(emailInput);

        // Reset button after 3 seconds
        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
          submitButton.style.backgroundColor = '';
        }, 3000);
      })
      .catch((error) => {
        console.error('Error:', error);
        submitButton.textContent = 'Error! Please try again';
        submitButton.style.backgroundColor = '#dc3545';

        // Reset button after 3 seconds
        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
          submitButton.style.backgroundColor = '';
        }, 3000);
      });
  });
}

// Animate service cards on scroll
const observerOptions = {
  threshold: 0.2,
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Apply animation to service cards
document.querySelectorAll('.service-card').forEach((card) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(card);
});

// Add loading animation for images
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// Add responsive menu toggle functionality
const createMobileMenu = () => {
  const nav = document.querySelector('nav');
  const navLinks = document.querySelector('.nav-links');

  // Create menu button
  const menuButton = document.createElement('button');
  menuButton.className = 'mobile-menu-button';
  menuButton.innerHTML = '<i class="fas fa-bars"></i>';
  menuButton.style.display = 'none';

  // Style for mobile
  if (window.innerWidth <= 768) {
    menuButton.style.display = 'block';
    navLinks.style.display = 'none';
  }

  // Add menu button to nav
  nav.appendChild(menuButton);

  // Toggle menu
  menuButton.addEventListener('click', () => {
    const isVisible = navLinks.style.display === 'flex';
    navLinks.style.display = isVisible ? 'none' : 'flex';
    menuButton.innerHTML = isVisible
      ? '<i class="fas fa-bars"></i>'
      : '<i class="fas fa-times"></i>';
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navLinks.style.display = 'flex';
      menuButton.style.display = 'none';
    } else {
      navLinks.style.display = 'none';
      menuButton.style.display = 'block';
    }
  });
};

// Language dropdown functionality
function toggleLanguageDropdown(isMobile = false) {
  const dropdownId = isMobile ? 'mobileLangDropdown' : 'languageDropdown';
  const selectorId = isMobile ? 'mobileLanguageSelector' : 'languageSelector';
  const dropdown = document.getElementById(dropdownId);
  const button = document.getElementById(selectorId).querySelector('button');

  // Close other dropdown if open
  const otherDropdownId = isMobile ? 'languageDropdown' : 'mobileLangDropdown';
  const otherDropdown = document.getElementById(otherDropdownId);
  if (otherDropdown) {
    otherDropdown.classList.add('hidden');
  }

  if (dropdown) {
    const rect = button.getBoundingClientRect();
    const header = document.querySelector('header');
    const headerRect = header.getBoundingClientRect();

    // Calculate position relative to viewport for mobile menu
    if (isMobile) {
      dropdown.style.top = `${rect.bottom}px`;
      dropdown.style.position = 'fixed';
    } else {
      dropdown.style.top = `${rect.bottom}px`;
      dropdown.style.position = 'fixed';
    }

    dropdown.style.left = `${rect.left - 10}px`;
    dropdown.style.width = `${rect.width + 20}px`;
    dropdown.classList.toggle('hidden');
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (event) => {
  const desktopSelector = document.getElementById('languageSelector');
  const mobileSelector = document.getElementById('mobileLanguageSelector');
  const menuButton = document.getElementById('menuButton');
  const mobileMenu = document.getElementById('mobileMenu');

  // Handle language dropdowns
  if (!desktopSelector?.contains(event.target) && !mobileSelector?.contains(event.target)) {
    const dropdowns = ['languageDropdown', 'mobileLangDropdown'];
    dropdowns.forEach((id) => {
      const dropdown = document.getElementById(id);
      if (dropdown) {
        dropdown.classList.add('hidden');
      }
    });
  }

  // Handle mobile menu
  if (
    mobileMenu &&
    !mobileMenu.contains(event.target) &&
    !menuButton.contains(event.target) &&
    !mobileMenu.classList.contains('hidden')
  ) {
    mobileMenu.classList.add('hidden');
    const icon = menuButton.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');

    // Close mobile language dropdown
    const mobileLangDropdown = document.getElementById('mobileLangDropdown');
    if (mobileLangDropdown) {
      mobileLangDropdown.classList.add('hidden');
    }
  }
});

// Language selection handling
function setLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      element.placeholder = translations[lang][key];
    }
  });

  // Store language preference
  localStorage.setItem('preferred-language', lang);

  // Update UI elements for both desktop and mobile
  const langElements = ['currentLanguage', 'mobileLangCurrent'];
  langElements.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = lang.toUpperCase();
    }
  });

  const dropdowns = ['languageDropdown', 'mobileLangDropdown'];
  dropdowns.forEach((id) => {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
  });
}

// Mobile menu toggle
const menuButton = document.getElementById('menuButton');
const mobileMenu = document.getElementById('mobileMenu');

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    const icon = menuButton.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
  });
}

// Initialize with stored language preference or default to English
document.addEventListener('DOMContentLoaded', () => {
  const storedLang = localStorage.getItem('preferred-language') || 'en';
  setLanguage(storedLang);

  // Set current year in footer
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
});

// Initialize mobile menu
createMobileMenu();

