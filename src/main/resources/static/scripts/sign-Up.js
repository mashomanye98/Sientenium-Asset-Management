// ================================
// NEW SIGN UP FORM LOGIC
// ================================
// ALERT
function showAlert(msg, type="error"){
    const alertEl = document.getElementById("customAlert");
    alertEl.textContent = msg;
    alertEl.className = "alert " + type;
    alertEl.style.display = "block";
    setTimeout(()=>{ alertEl.style.display="none"; },6000);
}
document.addEventListener("DOMContentLoaded", () => {

    // Grab the form once the page loads
    const signupForm =
        document.getElementById("signupForm");

    // Stop if form cannot be found
    if (!signupForm) {
        console.error("Signup form not found.");
        return;
    }

    // ================================
    // TOGGLE PASSWORD VISIBILITY
    // ================================
    const togglePasswordIcons = document.querySelectorAll(".toggle-password");

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const passwordInput = document.getElementById(targetId);

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            }
        });
    });

    // Listen for form submission
    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        // ================================
        // GET USER INPUTS
        // ================================

        const fullName =
            document.getElementById("fullName")
                .value
                .trim();

        const department =
            document.getElementById("department")
                .value;

        const email =
            document.getElementById("email")
                .value
                .trim()
                .toLowerCase();

        const password =
            document.getElementById("password")
                .value;

        const confirmPassword =
            document.getElementById("confirmPassword")
                .value;

        // ================================
        // BASIC VALIDATION
        // ================================

        if (!fullName) {
            showAlert(
                "Please enter your full name.",
                "error"
            );
            return;
        }

        if (!department) {
            showAlert(
                "Please select a department.",
                "error"
            );
            return;
        }

        if (!email) {
            showAlert(
                "Please enter an email address.",
                "error"
            );
            return;
        }

        if (password.length < 8) {
            showAlert(
                "Password must be at least 8 characters.",
                "error"
            );
            return;
        }

        if (password !== confirmPassword) {
            showAlert(
                "Passwords do not match.",
                "error"
            );
            return;
        }

        // ================================
        // BUILD REQUEST BODY
        // Must match RegisterRequest.java
        // ================================

        const requestBody = {

            fullName: fullName,

            email: email,

            password: password,

            department: department
        };

        try {

            // ================================
            // SEND REQUEST TO SPRING BOOT API
            // ================================

            const response = await fetch(
                `${window.location.origin}/api/auth/register`,
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

            // Parse backend response
            const data =
                await response.json();

            // ================================
            // HANDLE API ERRORS
            // ================================

            if (!response.ok) {

                showAlert(
                    data.message || data.error || "An error occurred.",
                    "error"
                );

                return;
            }

            // ================================
            // SUCCESS
            // ================================

            showAlert(
                data.message ||
                "Registration successful.",
                "success"
            );

            // Clear form fields
            signupForm.reset();

            // Redirect to login page
            setTimeout(() => {

                window.location.href =
                    "signIn.html";

            }, 2000);

        }
        catch (error) {

            console.error(error);

            showAlert(
                "A connection error occurred. Please restart the application and try again.",
                "error"
            );
        }

    });

});