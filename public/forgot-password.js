document.getElementById("forgotPasswordForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const securityAnswer = document.getElementById("securityAnswer") ? document.getElementById("securityAnswer").value : null;
    const newPassword = document.getElementById("newPassword") ? document.getElementById("newPassword").value : null;
    const otp = document.getElementById("otp") ? document.getElementById("otp").value : null;

    // Step 1: Submit Email to get the OTP
    if (document.getElementById("emailStep").style.display !== "none") {
        const response = await fetch("/send-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (data.success) {
            // Show the OTP input form
            document.getElementById("emailStep").style.display = "none";
            document.getElementById("otpStep").style.display = "block";
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
