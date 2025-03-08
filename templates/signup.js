let verificationCode;
let verificationCodeTimer;
let verificationCodeChecked = false;

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000);
}

function updateTimer(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    document.getElementById('verificationCodeTimer').textContent = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function sendVerificationCode() {
    clearTimeout(verificationCodeTimer);

    var email = document.getElementById('email').value;
    if (email.trim() === '') {
        alert('Please enter your email address.');
        return;
    }

    verificationCode = generateVerificationCode();
//    console.log('Verification code:', verificationCode);

    var url = `http://spacechat.co.kr:60000/send_verification_code/?email=${email}&verificationCode=${verificationCode}`;
    fetch(url, { method: 'GET'})
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to send verification code');
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        alert('Verification code has been sent to your email.');
        let timer = 3 * 60;
        updateTimer(timer);
        verificationCodeTimer = setInterval(function() {
            timer--;
            updateTimer(timer);
            if (timer === 0) {
                clearInterval(verificationCodeTimer);
                alert('Verification code has expired. Plase send it again.');
            }
        }, 1000);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to send verification code. Please try again later.');
    });
}

function checkVerificationCode() {
    if (verificationCode === undefined) {
        alert('Please send your verification code first.')
    }
    let inputCode = parseInt(document.getElementById('verificationCode').value, 10);
//    console.log('Verification code:', verificationCode);
//    console.log('input code: ', inputCode)

    if (inputCode === verificationCode) {
        alert('Verification code is correct.');
        clearInterval(verificationCodeTimer);
        document.getElementById('verificationCodeTimer').textContent = '';
        verificationCodeChecked = true;
        document.getElementById('email').disabled = true;
    } else if (inputCode !== verificationCode && verificationCode !== undefined) {
        alert('Verification code is incorrect.');
        verificationCodeChecked = false;
    }
}

function checkPasswordMatch() {
    var password = document.getElementById('password').value;
    var confirm_password = document.getElementById('confirm_password').value;
    var passwordMatchError = document.getElementById('passwordMatchError');

    if (password !== confirm_password) {
        passwordMatchError.innerText = 'Passwords do not match. Please enter the same password in both fields.';
        return false;
    } else {
        passwordMatchError.innerText = '';
        return true;
    }
}

function checkEmailFormat() {
    var email = document.getElementById('email').value;
    var emailFormatError = document.getElementById('emailFormatError');

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailFormatError.innerText = 'Invalid email format. Please enter a valid email address.';
        return false;
    } else {
        emailFormatError.innerText = '';
        return true;
    }
}

function checkUserNameLength() {
    var username = document.getElementById('user_name').value;
    var userNameLengthError = document.getElementById('userNameLengthError');

    if (username.length < 2) {
        userNameLengthError.innerText = 'Username must be at least 2 characters long.';
        return false;
    } else {
        userNameLengthError.innerText = '';
        return true;
    }
}

function checkPasswordLength() {
    var password = document.getElementById('password').value;
    var passwordLengthError = document.getElementById('passwordLengthError');

    if (password.length < 6 || password.length > 20) {
        passwordLengthError.innerText = 'Password must be between 6 and 20 characters long.';
        return false;
    } else {
        passwordLengthError.innerText = '';
        return true;
    }
}

function checkPasswordCriteria() {
    var password = document.getElementById('password').value;
    var passwordCriteriaError = document.getElementById('passwordCriteriaError');

    var passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{6,20}$/;
    if (!passwordRegex.test(password)) {
        passwordCriteriaError.innerText = 'Password must contain at least one letter, one number, and one special character.';
        return false;
    } else {
        passwordCriteriaError.innerText = '';
        return true;
    }
}

document.getElementById('confirm_password').addEventListener('input', checkPasswordMatch);
document.getElementById('email').addEventListener('input', checkEmailFormat);
document.getElementById('user_name').addEventListener('input', checkUserNameLength);
document.getElementById('password').addEventListener('input', checkPasswordLength);
document.getElementById('password').addEventListener('input', checkPasswordCriteria);

function validateForm() {
    var emailValid = checkEmailFormat();
    var userNameValid = checkUserNameLength();
    var passwordValid = checkPasswordLength();
    var passwordCriteriaValid = checkPasswordCriteria();
    var passwordMatchValid = checkPasswordMatch();

    if (!emailValid || !userNameValid || !passwordValid || !passwordCriteriaValid || !passwordMatchValid) {
        return false;
    }

    if (!verificationCodeChecked) {
        alert('Please check your verification code.');
        return false;
    }

    var email = encodeURIComponent(document.getElementById('email').value);
    var user_name = encodeURIComponent(document.getElementById('user_name').value);
    var password = encodeURIComponent(CryptoJS.SHA256(document.getElementById('password').value).toString());
    var confirm_password = encodeURIComponent(CryptoJS.SHA256(document.getElementById('confirm_password').value).toString());

    var url = `http://spacechat.co.kr:60000/server_sign_up/?email=${email}&user_name=${user_name}&password=${password}`;
    fetch(url, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data.status === 'success') {
                window.location.href = 'signup_success.html'; // Redirect to signup_success.html on success
            } else {
                alert('Email already exists. Please try with the other one.'); // Optionally handle other statuses or errors
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        });
    return true;
};