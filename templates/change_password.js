// Function to check if the new password matches the confirmed password
function checkPasswordMatch() {
    var newPassword = document.getElementById('new-password').value;
    var confirmPassword = document.getElementById('confirm-password').value;
    var passwordMatchError = document.getElementById('password-match-error');

    if (newPassword !== confirmPassword) {
        passwordMatchError.innerText = 'Passwords do not match. Please enter the same password in both fields.';
        return false;
    } else {
        passwordMatchError.innerText = '';
        return true;
    }
}

// Function to check if the new password meets the length requirement
function checkPasswordLength() {
    var newPassword = document.getElementById('new-password').value;
    var passwordLengthError = document.getElementById('password-length-error');

    if (newPassword.length < 6 || newPassword.length > 20) {
        passwordLengthError.innerText = 'Password must be between 6 and 20 characters long.';
        return false;
    } else {
        passwordLengthError.innerText = '';
        return true;
    }
}

// Function to check if the new password meets the criteria (contains letter, number, and special character)
function checkPasswordCriteria() {
    var newPassword = document.getElementById('new-password').value;
    var passwordCriteriaError = document.getElementById('password-criteria-error');

    var passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{6,20}$/;
    if (!passwordRegex.test(newPassword)) {
        passwordCriteriaError.innerText = 'Password must contain at least one letter, one number, and one special character.';
        return false;
    } else {
        passwordCriteriaError.innerText = '';
        return true;
    }
}

// Event listener for input in the new password field to trigger length and criteria checks
document.getElementById('new-password').addEventListener('input', function() {
    checkPasswordLength();
    checkPasswordCriteria();
});

// Event listener for input in the confirm password field to trigger match check
document.getElementById('confirm-password').addEventListener('input', checkPasswordMatch);

// Event listener for form submission to handle password change process
document.getElementById('change-password-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get user input values
    const currentPassword = encodeURIComponent(CryptoJS.SHA256(document.getElementById('current-password').value).toString());
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Check if passwords meet the criteria and match
    if (!checkPasswordMatch() || !checkPasswordLength() || !checkPasswordCriteria()) {
        return; // Stop form submission if checks fail
    }

    // Get logged-in user's email from local storage
    const loggedInEmail = decodeURIComponent(localStorage.getItem('loggedInEmail'));

    try {
        // Send request to server to verify current password
        const url = 'http://spacechat.co.kr:60000/check_current_password/';
        const data = { email: loggedInEmail, password: currentPassword };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const responseData = await response.json();

        // If current password is incorrect, show alert and stop further processing
        if (!responseData.passwordMatch) {
            alert('Current password is incorrect. Please try again.');
            return;
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            alert('New password and confirm password do not match. Please try again.');
            return;
        }

        // Send request to server to change password
        const url2 = 'http://spacechat.co.kr:60000/change_password/';
        const hashedPassword = CryptoJS.SHA256(newPassword).toString(); // Hash the new password
        const changePasswordResponse = await fetch(url2, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: loggedInEmail, password: hashedPassword })
        });
        const changePasswordData = await changePasswordResponse.json();

        // Show success or failure message based on server response
        if (changePasswordData.success) {
            alert('Password changed successfully.');
            window.close(); // Close the window after successful password change
        } else {
            alert('Failed to change password. Please try again later.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to change password. Please try again later.');
    }
});
