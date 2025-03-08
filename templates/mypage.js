function openChangePasswordPage() {
    window.open("change_password.html", "_blank", "width=400,height=400");
}
// 예약 날짜를 YYYY-MM-DD 형식으로 변환하는 함수
function formatDate(dateString) {
    console.log('Date string before formatting:', dateString);
    const date = new Date(dateString);
    console.log('Parsed date:', date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchReservations(email) {
    try {
        const url = `http://spacechat.co.kr:60000/fetch_reservations/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });
        const data = await response.json();
        console.log('Fetched reservations data:', data); // 데이터 확인
        if (data.error) {
            throw new Error(data.error);
        }

        // 예약 정보를 HTML에 표시
        const reservationsSection = document.getElementById('reservation-section');
        
        reservationsSection.innerHTML = ''; // 이전 예약 정보를 지우기
        reservationsSection.innerHTML = '<h2>Your Reservations</h2>';

        data.reservations.forEach(reservation => {
            console.log('Processing reservation:', reservation); // 각 예약 정보 확인
            // 예약 정보를 콘솔에 로그로 출력하여 확인
            console.log('ID:', reservation[0]);
            console.log('Menu:', reservation[1]);
            console.log('Reservation Date:', reservation[2]);
            console.log('Reservation Time:', reservation[3]); // 추가된 부분
            //reservationsSection.innerHTML = '<h2>Your Reservations</h2>';

            // 만약 어떤 예약 정보가 NULL인 경우, 해당 예약 정보를 무시합니다.
            if (reservation[0] && reservation[1] && reservation[2]) {
                const reservationElement = document.createElement('div');
                reservationElement.classList.add('reservation');

                const h3 = document.createElement('h3');
                h3.textContent = `Reservation ${reservation[0]}`;
                reservationElement.appendChild(h3);

                const formattedDate = formatDate(reservation[2]); // 날짜 포맷 변경
                const dateP = document.createElement('p');
                dateP.textContent = `Reservation Date: ${formattedDate}`;
                reservationElement.appendChild(dateP);

                const timeP = document.createElement('p'); // 시간 표시용 요소 생성
                timeP.textContent = `Reservation Time: ${reservation[3]}`; // 시간 표시 추가
                reservationElement.appendChild(timeP); // 시간 표시 추가

                const menuP = document.createElement('p');
                menuP.textContent = `Menu: ${reservation[1]}`;
                reservationElement.appendChild(menuP);

                reservationsSection.appendChild(reservationElement);
            }

        });

        if (data.reservations.length === 0) {
            reservationsSection.innerHTML += '<p>No reservations found.</p>'; // Append message if no reservations
        }

    } catch (error) {
        console.error('Error fetching reservations:', error);
    }

    //수정
    reservationElement.classList.add('reservation-item');
    dateP.classList.add('reservation-date');
    timeP.classList.add('reservation-time');
    menuP.classList.add('reservation-menu');
}




// 서버로부터 사용자 정보를 가져오는 함수
async function fetchUserInfo(email) {
    try {
        const url = `http://spacechat.co.kr:60000/mypage/?email=${email}`;
        console.log("here");
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
}

// 클릭 이벤트 핸들러 및 사용자 이름 변경 함수
document.getElementById('change-username-btn').addEventListener('click', async function() {
    const usernameSpan = document.getElementById('username');
    const usernameInput = document.getElementById('new-username');
    const changeBtn = document.getElementById('change-username-btn');
    const errorSpan = document.getElementById('username-error');

    if (changeBtn.classList.contains('editing')) {
        // Save button click event
        const newUsername = usernameInput.value.trim();

        // Validate the username length
        if (newUsername.length < 2) {
            errorSpan.style.display = 'block';
            return; // Exit the function without proceeding
        } else {
            errorSpan.style.display = 'none';
        }

        // Proceed with updating the username
        usernameSpan.textContent = newUsername;
        usernameInput.style.display = 'none';
        usernameSpan.style.display = 'inline';
        changeBtn.textContent = 'Change';
        changeBtn.classList.remove('editing');

        const loggedInEmail = decodeURIComponent(localStorage.getItem('loggedInEmail'));
        try {
            const url = `http://spacechat.co.kr:60000/change_username/`;
            const data = { email: loggedInEmail, username: newUsername };
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (responseData.error) {
                throw new Error(responseData.error);
            }
            console.log('Username changed successfully:', newUsername);
        } catch (error) {
            console.error('Failed to change username:', error);
        }
    } else {
        // Change button click event
        usernameInput.value = usernameSpan.textContent;
        usernameSpan.style.display = 'none';
        usernameInput.style.display = 'inline-block';
        changeBtn.textContent = 'Save';
        changeBtn.classList.add('editing');
    }
});
;


function showUsernameInput() {
    const usernameSpan = document.getElementById('username');
    const changeUsernameBtn = document.getElementById('change-username-btn');
    const newUsernameInput = document.getElementById('new-username');
    
    newUsernameInput.style.display = 'inline-block';
    newUsernameInput.style.width = `${changeUsernameBtn.offsetWidth}px`;
    usernameSpan.style.display = 'none';
    changeUsernameBtn.style.display = 'none';
}

        // 클릭 이벤트 핸들러 - 로그아웃 버튼
document.getElementById('logout').addEventListener('click', function() {
    // 로컬 스토리지에서 로그인 정보 제거
    localStorage.loggedInEmail = 'None';
    alert('Successfully Logged out.');
    // chat.html로 이동
    window.location.href = 'chat.html';
});

document.getElementById('delete-account-link').addEventListener('click', async function(event) {
    event.preventDefault(); // 링크 기본 동작 방지

    const loggedInEmail = decodeURIComponent(localStorage.getItem('loggedInEmail'));

    // 사용자에게 삭제 확인 메시지를 보여줌
    const confirmDelete = confirm("Are you sure you want to delete your account?");
    if (confirmDelete) {
        try {
            const url = `http://spacechat.co.kr:60000/delete_account/`;
            const data = { email: loggedInEmail };
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (responseData.success) {
                // 삭제가 성공하면 로그아웃하고 index.html로 이동
                alert(responseData.message);
                localStorage.removeItem('loggedInEmail');
                window.location.href = 'index.html'; // 첫 화면으로 이동
            } else {
                throw new Error(responseData.error);
            }
        } catch (error) {
            console.error('Failed to delete account:', error);
            // 실패한 경우에 대한 처리
            alert('Failed to delete account. Please try again later.');
        }
    }
});

        


        
// 페이지 로드 시 예약 정보 가져오기
window.onload = async function() {
    const loggedInEmailEncoded = localStorage.getItem('loggedInEmail'); // 인코딩된 이메일 주소 가져오기
    if (loggedInEmailEncoded) {
        const loggedInEmail = decodeURIComponent(loggedInEmailEncoded); // 디코딩
        document.getElementById('email').textContent = loggedInEmail;
        try {
            const userInfo = await fetchUserInfo(loggedInEmail);
            const username = userInfo.username; // 사용자 이름 가져오기
            const userImage = userInfo.image;
            document.getElementById('username').textContent = username; // 사용자 이름 표시
            console.log("Loaded userEmail:", loggedInEmail);

            // 사용자 이미지 표시
            const profilePic = document.getElementById('profile-pic').querySelector('img');
            if (userImage) {
                profilePic.src = `data:image/jpeg;base64,${userImage}`;
            } else {
                profilePic.src = 'profile-icon.png'; // 기본 프로필 이미지 경로 설정
            }

        } catch (error) {
            console.error('Error fetching user info:', error);
            // 에러 처리 (예: 사용자에게 메시지 표시)
        }
        fetchReservations(loggedInEmail);
        console.log("Loaded userEmail:", loggedInEmail);
    } else {
        document.getElementById('email').textContent = "이메일을 찾을 수 없습니다.";
    }
}

document.getElementById('profile-upload').addEventListener('change', async function(event) {
    const file = event.target.files[0];   
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
        const loggedInEmail = decodeURIComponent(localStorage.getItem('loggedInEmail'));
        formData.append('email', loggedInEmail);
        const url = `http://spacechat.co.kr:60000/update_profile_image`;
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log(data.message); // 서버로부터의 응답 확인

        const profilePic = document.getElementById('profile-pic').querySelector('img');
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePic.src = e.target.result;
        }
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error updating profile image:', error);
    }
});



// Function to handle username change
// Function to handle username change
async function handleUsernameChange() {
    const usernameSpan = document.getElementById('username');
    const usernameInput = document.getElementById('new-username');
    const errorSpan = document.getElementById('username-error');

    // Save button click event
    const newUsername = usernameInput.value.trim();

    // Validate the username length
    if (newUsername.length < 2) {
        errorSpan.style.display = 'block';
        return; // Exit the function without proceeding
    } else {
        errorSpan.style.display = 'none';
    }

    const loggedInEmail = decodeURIComponent(localStorage.getItem('loggedInEmail'));
    try {
        const url = `http://spacechat.co.kr:60000/change_username/`;
        const data = { email: loggedInEmail, username: newUsername };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const responseData = await response.json();
        if (responseData.error) {
            throw new Error(responseData.error);
        }
        console.log('Username changed successfully:', newUsername);

        // Update the displayed username
        usernameSpan.textContent = newUsername;
    } catch (error) {
        console.error('Failed to change username:', error);
    }
}

// Add event listener for the change button
document.getElementById('change-username-btn').addEventListener('click', handleUsernameChange);
// Add event listener for Enter key press in the username input field
document.getElementById('new-username').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default form submission behavior of Enter key
        handleUsernameChange(); // Call the handleUsernameChange function when Enter is pressed
        // Simulate a click event on the save button
        document.getElementById('change-username-btn').click();
    }
});




