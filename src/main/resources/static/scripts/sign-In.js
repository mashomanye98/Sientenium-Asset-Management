// =======================================
// CUSTOM ALERT
// =======================================

function showAlert(message, type = "error") {

    const alertBox =
        document.getElementById("customAlert");

    alertBox.textContent = message;

    alertBox.className =
        "alert " + type;

    alertBox.style.display = "block";

    setTimeout(() => {

        alertBox.style.display = "none";

    }, 4000);
}

// =======================================
// REDIRECT USERS BASED ON ROLE
// =======================================

function redirectToDashboard(role) {

    switch (role) {

        case "ROLE_ADMIN":

            window.location.href =
                "dashboard/admin-dashboard.html";
            break;

        case "ROLE_MANAGER":

            window.location.href =
                "dashboard/manager-dashboard.html";
            break;

        case "ROLE_STAFF":

            window.location.href =
                "dashboard/staff-dashboard.html";
            break;

        default:

            showAlert(
                "Unknown User Role.",
                "error"
            );
    }
}

// =======================================
// SIGN IN LOGIC
// =======================================

document.addEventListener("DOMContentLoaded", () => {

    const signinForm =
        document.getElementById("loginForm");

    // Safety check
    if (!signinForm) {

        console.error(
            "Sign-in form not found."
        );

        return;
    }

    // Listen for login request
    signinForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            // ===========================
            // GET USER INPUTS
            // ===========================

            const email =
                document.getElementById("loginEmail")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document.getElementById("password")
                    .value;

            // ===========================
            // BASIC VALIDATION
            // ===========================

            if (!email) {

                showAlert(
                    "Please enter your email.",
                    "error"
                );

                return;
            }

            if (!password) {

                showAlert(
                    "Please enter your password.",
                    "error"
                );

                return;
            }

            // Build request body
            const requestBody = {

                email: email,

                password: password
            };

            try {

                // ===========================
                // SEND LOGIN REQUEST
                // ===========================

                const response =
                    await fetch(
                        `${window.location.origin}/api/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(requestBody)
                        }
                    );

                const data =
                    await response.json();

                // ===========================
                // HANDLE LOGIN ERRORS
                // ===========================

                if (!response.ok) {

                    showAlert(
                        data.message ||
                        "Invalid email or password.",
                        "error"
                    );

                    return;
                }

                // ===========================
                // SAVE USER SESSION
                // ===========================

                sessionStorage.setItem(
                    "currentUser",
                    JSON.stringify({

                        email: data.email,

                        role: data.role

                    })
                );

                // ===========================
                // LOGIN SUCCESS
                // ===========================

                showAlert(
                    data.message ||
                    "Login successful.",
                    "success"
                );

                // Small delay so user sees alert
                setTimeout(() => {

                    redirectToDashboard(
                        data.role
                    );

                }, 3000);

            }
            catch (error) {

                console.error(
                    "Login Error:",
                    error
                );

                showAlert(
                    "Account Already Exists.",
                    "error"
                );
            }
        }
    );
});