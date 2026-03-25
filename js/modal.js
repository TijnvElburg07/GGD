// Modal functionaliteit
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('login-modal');
    const closeButton = document.querySelector('.close-button');
    const loginForm = document.getElementById('login-form');
    
    // Sluit modal wanneer op de close button wordt geklikt
    if (closeButton) {
        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.hash = '';
        });
    }
    
    // Sluit modal wanneer buiten de modal-content wordt geklikt
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                window.location.hash = '';
            }
        });
    }
    
    // Login form submit handler
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Redirect naar admin.html
            window.location.href = 'admin.html';
        });
    }
});
