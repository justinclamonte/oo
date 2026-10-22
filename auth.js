
console.log("Academic Hub auth.js loaded!");
alert("auth.js started loading!");
const authClient = window.academicSupabase;
const dashboardSection =
    document.getElementById("dashboard-section");
const authForm = document.getElementById("auth-form");
alert("Login form found: " + Boolean(authForm));
const authTitle = document.getElementById("auth-title");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authToggle = document.getElementById("auth-toggle");
const authLogout = document.getElementById("auth-logout");
const authMessage = document.getElementById("auth-message");

let isSignUp = false;

function showAuthMessage(message) {
    authMessage.textContent = message;
}

authToggle.addEventListener("click", function () {
    console.log("Create Account button clicked!");
    isSignUp = !isSignUp;

    authTitle.textContent = isSignUp
        ? "Create Your Academic Hub Account"
        : "Academic Hub Login";

    authSubmit.textContent = isSignUp
        ? "Sign Up"
        : "Log In";

    authToggle.textContent = isSignUp
        ? "Already have an account? Log In"
        : "Create an Account";

    authPassword.autocomplete = isSignUp
        ? "new-password"
        : "current-password";

    showAuthMessage("");
});

authForm.addEventListener("submit", async function (event) {
    event.preventDefault();
  alert("Login form is responding!");

    if (!authClient) {
        showAuthMessage("Connection error. Please refresh the page.");
        return;
    }

    authSubmit.disabled = true;
    showAuthMessage("Please wait...");

    try {
        const email = authEmail.value.trim();
        const password = authPassword.value;

        if (isSignUp) {
            const { data, error } = await authClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo:
                        "https://fanciful-donut-58ab6f.netlify.app/"
                }
            });

            if (error) throw error;

            if (data.session) {
                showAuthMessage("Account created! You're logged in.");
            } else {
                showAuthMessage(
                    "Account created! Check your email for a confirmation link."
                );
            }
        } else {
            const { error } = await authClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            showAuthMessage("Welcome back to Academic Hub!");
        }
    } catch (error) {
        showAuthMessage(error.message);
    } finally {
        authSubmit.disabled = false;
    }
});

authLogout.addEventListener("click", async function () {
    const { error } = await authClient.auth.signOut();

    showAuthMessage(
        error ? error.message : "You have logged out."
    );
});

authClient.auth.onAuthStateChange(dashboardSection.hidden = !session; (event, session) {
    if (session) {
        authTitle.textContent = "Welcome to Academic Hub!";
        authEmail.hidden = true;
        authPassword.hidden = true;
        authSubmit.hidden = true;
        authToggle.hidden = true;
        authLogout.hidden = false;
        authForm.querySelector('label[for="auth-email"]').hidden = true;
        authForm.querySelector('label[for="auth-password"]').hidden = true;
    } else {
        authTitle.textContent = isSignUp
            ? "Create Your Academic Hub Account"
            : "Academic Hub Login";

        authEmail.hidden = false;
        authPassword.hidden = false;
        authSubmit.hidden = false;
        authToggle.hidden = false;
        authLogout.hidden = true;
        authForm.querySelector('label[for="auth-email"]').hidden = false;
        authForm.querySelector('label[for="auth-password"]').hidden = false;
    }
});
