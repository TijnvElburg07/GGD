async function saveIpv4(ip) {
    try {
        const response = await fetch('http://localhost:3000/save-ip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        console.log('IP saved:', result);
    } catch (err) {
        console.error('Failed to save IP', err);
    }
};

async function getIpv4() {
    try {
        const respose = await fetch('https://api.ipify.org?format=json');
        if (!respose.ok) throw new Error(`HTTP ${respose.status}`);
        const data = await respose.json();


        return data.ip;
    } catch (err) {
        console.error('Failed to fetch IPv4 address', err);
        return null;
    }
};

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
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const resp = await fetch('js/data/users.json', { cache: 'no-store' });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const users = await resp.json();
                
                let loggedInUser = null;
                for (const key in users) {
                    const user = users[key];
                    if (user.username === username && user.password === password) {
                        loggedInUser = user;
                        break;
                    }
                }
                
                if (loggedInUser) {
                    // Sla user op in localStorage
                    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                    
                    // Update UI
                    updateLoginStatus();
                    
                    // Sluit modal
                    window.location.hash = '';
                    
                    // Geen redirect meer, altijd blijven op pagina
                } else {
                    const ip = await getIpv4();
                    if (ip) {
                        await saveIpv4(ip);
                    }
                    alert('Ongeldige gebruikersnaam of wachtwoord' + (ip ? ` (IP: ${ip})` : ''));
                }
            } catch (err) {
                console.error('Failed to load users.json', err);
                alert('Kon gebruikers niet laden. Probeer het later opnieuw.');
            }
        });
    }
    
    // Check bij load of er een ingelogde user is
    updateLoginStatus();
});

// Functie om login status te updaten
function updateLoginStatus() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const loginLi = document.getElementById('login-li');
    
    if (loggedInUser) {
        // Vervang login li met user li
        const userLi = document.createElement('li');
        const userLink = document.createElement('a');
        userLink.textContent = `Welkom, ${loggedInUser.name}`;
        userLink.href = '#';
        userLink.classList.add('nav-link', 'logged-in');
        userLink.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('loggedInUser');
            location.reload(); // Herlaad pagina om UI te resetten
        });
        userLi.appendChild(userLink);
        loginLi.parentNode.replaceChild(userLi, loginLi);
        
        // Als admin, voeg admin panel link toe na de user li
        if (loggedInUser.role === 'admin') {
            const adminLi = document.createElement('li');
            const adminLink = document.createElement('a');
            adminLink.textContent = 'Admin Panel';
            adminLink.href = 'admin.html';
            adminLink.classList.add('nav-link');
            userLi.parentNode.insertBefore(adminLi, userLi.nextSibling);
        }
    } else {
        // Zorg dat login li er is
        if (!loginLi) {
            const navList = document.querySelector('.nav-list');
            const loginLiNew = document.createElement('li');
            loginLiNew.id = 'login-li';
            const loginLink = document.createElement('a');
            loginLink.href = '#login-modal';
            loginLink.textContent = 'Inloggen';
            loginLink.classList.add('login-btn', 'nav-link');
            loginLiNew.appendChild(loginLink);
            navList.appendChild(loginLiNew);
        }
    }
}
