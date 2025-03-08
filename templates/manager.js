const socket = io('http://spacechat.co.kr:60000?role=manager');
let currentRoom = '';
let deleteMode = false;

document.addEventListener('DOMContentLoaded', function() {
    loadReservations(); // 페이지 로드 시 예약 내역을 불러옵니다.
    //수정
    document.getElementById('menu-icon').addEventListener('click', toggleSidebar);
    //const overlay = document.getElementById('overlay');
    //overlay.classList.remove('sidebar-out');
});

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadReservations() {
    const url = 'http://spacechat.co.kr:60000/get_reservations';
    try {
        const response = await fetch(url);
        if (response.ok) {
            const reservations = await response.json();
            console.log('Received reservations:', reservations);
            const reservationList = document.getElementById('reservationList');
            reservationList.innerHTML = ''; // 기존 내용을 초기화합니다.
            reservations.forEach(function(reservation) {
                const formattedDate = formatDate(reservation.reserv_date);
                const reservationElement = document.createElement('div');
                reservationElement.classList.add('reservation-card');
                reservationElement.innerHTML = `
                    <div class="reservation-header">
                        <strong>Reserv ${reservation.id}</strong>
                        <span>${formattedDate} ${reservation.reserv_time}</span>
                    </div>
                    <div class="reservation-body">
                        <p><strong>name:</strong>${reservation.name}</p>
                        <p><strong>Tel:</strong> ${reservation.tel}</p>
                        <p><strong>Email:</strong> ${reservation.email}</p>
                        <p><strong>Menu:</strong> ${reservation.menu}</p>
                    </div>
                `;
                reservationList.appendChild(reservationElement);
            });
        } else {
            console.log('Failed to load reservations:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
    }
}
//수정
function toggleSidebar() {
    const sidebar = document.getElementById('chatSidebar');
    //const chatMain = document.getElementById('chatMain');
    //const overlay = document.getElementById('overlay');
    sidebar.style.display = (sidebar.style.display === 'block') ? 'none' : 'block';
    //sidebar.classList.toggle('sidebar-out');
    //chatMain.classList.toggle('sidebar-out');
    //overlay.classList.toggle('sidebar-out');
}   

async function joinRoom(room, email) {
    if (currentRoom) {
        socket.emit('leave', { username: 'Manager', room: currentRoom });
    }
    currentRoom = room;
    socket.emit('join', { username: 'Manager', room: currentRoom });
    document.getElementById('messages').innerHTML = '';
    document.getElementById('chatSidebar').style.display = 'none';
    document.getElementById('chatMain').style.display = 'flex';
    document.getElementById('chatHeader').innerText = email;
    await loadPreviousMessages(currentRoom); // 이전 메시지 불러오기
    }

// 이전 메시지를 불러와서 화면에 표시하는 함수
async function loadPreviousMessages(room_id) {
    console.log('Loading previous messages for room ID:', room_id);
    const url = 'http://spacechat.co.kr:60000/get_messages';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ room_id })
        });

        if (response.ok) {
            const messages = await response.json();
            console.log('Received messages:', messages);
            const messagesDiv = document.getElementById('messages');
            messages.forEach(function(msg) {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message'); // 메시지 클래스 추가
                messageElement.innerText = `${msg.message}`;
                console.log("sender : " + msg.sender);
                if (msg.sender === 'Manager') {  // customer
                    console.log("I'm manager");
                    messageElement.classList.add('sent');
                } else {  // manager
                    console.log("I'm customer");
                    messageElement.classList.add('received');
                }
                messagesDiv.appendChild(messageElement);

                // 디버깅 출력
            });
        } else {
            console.log('Failed to load previous messages for room ID:', room_id);
        }
    } catch (error) {
        console.error('Error loading previous messages:', error);
        // Handle error
    }
}


/*function goBack() {
    document.getElementById('chatSidebar').style.display = 'block';
    document.getElementById('chatMain').style.display = 'none';
    if (currentRoom) {
        socket.emit('leave', { username: 'Manager', room: currentRoom });
        currentRoom = '';
        }
}*/

function toggleDeleteMode() {
    deleteMode = !deleteMode;
    const deleteButton = document.getElementById('deleteButton');
    const confirmButton = document.getElementById('confirmButton');
    if (deleteMode) {
        deleteButton.style.display = 'none';
        confirmButton.style.display = 'inline';
        showCheckboxes();
    } else {
        deleteButton.style.display = 'inline';
        confirmButton.style.display = 'none';
        hideCheckboxes();
    }
}

function showCheckboxes() {
    const checkboxes = document.querySelectorAll('.checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.style.display = 'inline';
    });
}

function hideCheckboxes() {
    const checkboxes = document.querySelectorAll('.checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.style.display = 'none';
    });
}

function deleteSelectedRooms() {
    const selectedRooms = document.querySelectorAll('input[type="checkbox"]:checked');
    selectedRooms.forEach(room => {
        const roomId = room.value;
        socket.emit('delete_room', { room_id: roomId });
        room.parentElement.remove(); // UI에서 삭제된 방 제거
    });
    toggleDeleteMode();
}

socket.on('connect', function() {
    socket.emit('get_rooms');

    socket.on('rooms_list', async function(data) {
        const chatRooms = document.getElementById('chatRooms');
        chatRooms.innerHTML = '';

        for (const room of data.rooms) {
            const roomDiv = document.createElement('div');
            roomDiv.classList.add('room');

            // Guest 전용 채팅방인 경우 삭제 체크박스를 표시하지 않음
            if (room.startsWith('guest')) {
                const button = document.createElement('button');
                button.innerText = `비회원`;
                button.onclick = () => joinRoom(room, '비회원');
                roomDiv.appendChild(button);
            } else {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = room;
                checkbox.classList.add('checkbox');
                checkbox.style.display = 'none'; // 체크박스 숨김
                roomDiv.appendChild(checkbox);

                const url = 'http://spacechat.co.kr:60000/get_email';
                const data = { room_id: room };
                let email = 'No Email'; // 초기 값을 명확히 설정

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    if (response.ok) {
                        const result = await response.json();
                        email = result.email || 'No Email'; // 서버에서 받아온 email 반환, 없으면 'No Email' 설정
                        console.log('Email for room', room, ':', email);
                    } else {
                        console.error('Failed to get email for room ID:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error getting email for room ID:', error);
                }

                const button = document.createElement('button');
                button.innerText = email;
                button.onclick = () => joinRoom(room, email);
                roomDiv.appendChild(button);
            }

            chatRooms.appendChild(roomDiv);
        }
    });


    socket.on('new_room_id', async function(room_id) {
        console.log("Received new room ID:", room_id);
        const chatRooms = document.getElementById('chatRooms');
        const roomDiv = document.createElement('div');
        roomDiv.classList.add('room');
                
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = room_id;
        checkbox.classList.add('checkbox');
        checkbox.style.display = 'none'; // 체크박스 숨김
        roomDiv.appendChild(checkbox);

        const button = document.createElement('button');
        console.log(email);
        button.innerText = "New";
        button.onclick = () => joinRoom(room_id, email);
        roomDiv.appendChild(button);

        chatRooms.appendChild(roomDiv);
    });

    socket.on('room_deleted', function(room_id) {
        console.log("Room deleted:", room_id);
        const chatRooms = document.getElementById('chatRooms');
        const roomDivs = chatRooms.querySelectorAll('.room');
        roomDivs.forEach(roomDiv => {
            const checkbox = roomDiv.querySelector('input[type="checkbox"]');
            if (checkbox.value === room_id) {
                roomDiv.remove();
            }
        });
    });
});

socket.on('message', function(data) {
    const messages = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    console.log(data.sender)
    if (data.sender === 'Manager') {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }
    messageElement.innerText = `${data.message}`;
    console.log("Recieved Msg from Customer: "+data.message);
  //  if (data.sender === "guest") room = 'guest';
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
});

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (message) {
        console.log("Sending room : " + currentRoom);
        socket.emit('message', { room: currentRoom, message: message, sender: 'Manager' });
        const url = 'http://spacechat.co.kr:60000/save_message';
        const data = { room: currentRoom, message: message, sender: "Manager" };
        try {
            const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
            });

            if (response.ok) {
            console.log('Message sent successfully');
            console.log("관리자가 보낸 Msg"+message);
                    // Handle success if needed
            } else {
            console.error('Failed to send message:', response.statusText);
                    // Handle failure if needed
            }
        } catch (error) {
            console.error('Error sending message:', error);
                    // Handle error
        }
        messageInput.value = '';
    }
}

document.getElementById('messageInput').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

function convertToCSV(reservations) {
    const headers = ['Subject', 'Start Date', 'Start Time', 'End Date', 'End Time', 'All Day Event', 'Description', 'Location', 'Private'];
    const rows = reservations.map(reservation => {
        const formattedDate = formatDate(reservation.reserv_date);
        return [
            `${reservation.id} ${reservation.menu}`,
            formattedDate,
            reservation.reserv_time,
            formattedDate,
            '', // End Time (if needed)
            'False', // All Day Event
            `Name: ${reservation.name}, Tel: ${reservation.tel}, Email: ${reservation.email}`,
            '', // Location (if needed)
            'True' // Private
        ].map(field => `"${field}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv, filename) {
    const csvFile = new Blob([csv], { type: 'text/csv' });
    const downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

async function syncWithGoogleCalendar() {
    console.log('Sync with Google Calendar');
/*
    try {
        const url = 'http://spacechat.co.kr:60000/sync_with_google_calendar';
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include' // 쿠키를 서버에 보내도록 설정
        });
        if (response.ok) {
            console.log('Temporary event added to Google Calendar successfully.');
        } else {
            console.error('Failed to add temporary event to Google Calendar:', response.statusText);
        }
    } catch (error) {
        console.error('Error adding temporary event to Google Calendar:', error);
    }
    */

    const url = 'http://spacechat.co.kr:60000/get_reservations';
    try {
        const response = await fetch(url);
        if (response.ok) {
            const reservations = await response.json();
            const csv = convertToCSV(reservations);
            downloadCSV(csv, 'reservations.csv');
            console.log('Reservations exported to CSV successfully.');
        } else {
            console.error('Failed to load reservations for export:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading reservations for export:', error);
    }
}
