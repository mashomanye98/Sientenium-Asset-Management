// Hey there! This small script handles both the "Forgot Password" page and the
// "Reset Password" page. I kept it simple and added friendly comments so it's
// easy to understand and maintain later on.

(function(){
  const alertBox = document.getElementById('customAlert');

  // A tiny helper to show nice alerts at the top of the screen
  function showAlert(message, type = 'success') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = 'alert ' + (type === 'error' ? 'error' : 'success');
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
  }

  // Another helper to handle password visibility toggles (little eye icon)
  function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(icon => {
      icon.addEventListener('click', () => {
        const targetId = icon.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      });
    });
  }

  // If we're on the Forgot Password page, wire up the form
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('fpEmail').value.trim();

      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.message || data.error || 'We could not process your request right now.';
          showAlert(msg, 'error');
          return;
        }

        // For your testing convenience, if you want to always send to a specific
        // email (like johnnymotsemme6@gmail.com), simply type it into the field.
        showAlert('If your email exists, a reset link has been sent. Please check your inbox.');
      } catch (err) {
        showAlert('Network error. Please try again in a moment.', 'error');
      }
    });
  }

  // If we're on the Reset Password page, wire up the form there too
  const resetForm = document.getElementById('resetForm');
  if (resetForm) {
    initPasswordToggles();

    // Grab the token from the URL and store it in a hidden input
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const tokenField = document.getElementById('token');
    if (token && tokenField) tokenField.value = token;

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newPassword = document.getElementById('newPassword').value.trim();
      const confirmPassword = document.getElementById('confirmPassword').value.trim();
      const tokenValue = document.getElementById('token').value.trim();

      // Simple friendly validation
      if (newPassword.length < 6) {
        showAlert('Please choose a password with at least 6 characters.', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showAlert("Those passwords don't match. Let's try again.", 'error');
        return;
      }

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenValue, newPassword })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.message || data.error || 'We could not reset your password.';
          showAlert(msg, 'error');
          return;
        }

        showAlert('Your password has been updated. Redirecting you to Sign In...');
        setTimeout(() => window.location.href = 'signIn.html', 1800);
      } catch (err) {
        showAlert('Network error. Please try again in a moment.', 'error');
      }
    });
  }
})();