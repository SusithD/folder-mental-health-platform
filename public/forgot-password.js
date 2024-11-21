document.getElementById("forgotPasswordForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const securityAnswer = document.getElementById("securityAnswer") ? document.getElementById("securityAnswer").value : null;
    const newPassword = document.getElementById("newPassword") ? document.getElementById("newPassword").value : null;

    if (document.getElementById("emailStep").style.display !== "none") {
        // Step 1: Submit Email to get the security question
        const response = await fetch("/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (data.success) {
            // Show the security question
            document.getElementById("emailStep").style.display = "none";
            document.getElementById("questionStep").style.display = "block";
            document.getElementById("securityQuestionLabel").textContent = data.securityQuestion;
        } else {
            alert(data.message);
        }
    }

    if (document.getElementById("questionStep").style.display !== "none") {
        // Step 2: Verify the security answer
        const response = await fetch("/verify-answer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, securityAnswer })
        });

        const data = await response.json();
        if (data.success) {
            // Show reset password form
            document.getElementById("questionStep").style.display = "none";
            document.getElementById("resetPasswordStep").style.display = "block";
        } else {
            alert(data.message);
        }
    }

    if (document.getElementById("resetPasswordStep").style.display !== "none") {
        // Step 3: Reset the password
        const response = await fetch("/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, newPassword })
        });

        const data = await response.json();
        if (data.success) {
            alert("Password reset successful!");
        } else {
            alert(data.message);
        }
    }
});