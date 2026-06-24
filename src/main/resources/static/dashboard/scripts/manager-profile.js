(function () {
    function readCurrentUser() {
        try {
            return JSON.parse(sessionStorage.getItem("currentUser")) || {};
        } catch (error) {
            return {};
        }
    }

    function getDisplayName() {
        const user = readCurrentUser();
        return user.fullName ||
            user.name ||
            user.userName ||
            localStorage.getItem("userName") ||
            user.email ||
            "Manager";
    }

    function updateManagerProfile() {
        const profile = document.querySelector(".sidebar .profile");
        if (!profile) return;

        let nameEl = profile.querySelector("#user-name");
        const roleEl = profile.querySelector("p");

        if (roleEl) {
            roleEl.textContent = "Manager";
            roleEl.removeAttribute("id");
        }

        if (!nameEl) {
            nameEl = document.createElement("h3");
            nameEl.id = "user-name";
            if (roleEl) {
                profile.insertBefore(nameEl, roleEl);
            } else {
                profile.appendChild(nameEl);
            }
        }

        nameEl.textContent = getDisplayName();
    }

    document.addEventListener("DOMContentLoaded", updateManagerProfile);
})();
