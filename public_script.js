document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registration-form');
    const loginForm = document.getElementById('login-form');
    const logoutForm = document.getElementById('logout-form');
    const userDetails = document.getElementById('user-details');
    const detailsUsername = document.getElementById('details-username');
    const detailsTelephone = document.getElementById('details-Telephone');

    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const Telephone = document.getElementById('Telephone').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, Telephone, password })
                });

                if (response.ok) {
                    alert('Registration successful');
                } else {
                    const errorData = await response.json();
                    alert('Registration failed: ' + errorData.errors.map(err => err.msg).join(', '));
                }
            } catch (error) {
                alert('Registration failed: ' + error.message);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    userDetails.style.display = 'block';
                    detailsUsername.textContent = `Username: ${data.username}`;
                    detailsTelephone.textContent = `Telephone: ${data.Telephone}`;
                    loginForm.style.display = 'none';
                    registrationForm.style.display = 'none';
                    logoutForm.style.display = 'block';
                } else {
                    alert('Login failed');
                }
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        });
    }

    if (logoutForm) {
        logoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const response = await fetch('/logout', {
                    method: 'POST'
                });

                if (response.ok) {
                    userDetails.style.display = 'none';
                    loginForm.style.display = 'block';
                    registrationForm.style.display = 'block';
                    logoutForm.style.display = 'none';
                } else {
                    alert('Logout failed');
                }
            } catch (error) {
                alert('Logout failed: ' + error.message);
            }
        });
    }
});
