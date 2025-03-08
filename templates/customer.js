let room;
// 번역된 텍스트를 저장할 객체
const translatedMessages = {};
var currentLanguage = 'kor'; // 현재 언어 설정


// Deepl API를 사용하여 메시지 언어를 감지하는 함수
async function detectLanguage(text) {
  var deeplAPIKey = '929fcdd7-b79a-4bbc-9737-dc580ac5a12f'; // Deepl API 키를 여기에 입력
  var deeplEndpoint = 'https://api.deepl.com/v2/translate'; // Deepl API 엔드포인트

  return fetch(deeplEndpoint + '?auth_key=' + deeplAPIKey + '&text=' + encodeURIComponent(text) + '&target_lang=EN')
  .then(response => response.json())
  .then(data => {
      // 언어 코드를 대문자로 변환하여 반환
      var detectedLang = data.translations[0].detected_source_language.toUpperCase();
      // 만약 검출된 언어가 한국어라면, 언어 코드를 영어로 변경하여 반환
      return detectedLang;
  
  });
}
//customer message를 한국어로 번역 -> sendMessage로 보내려고
function translateKor(detectedLang, text) {
  var deeplAPIKey = '929fcdd7-b79a-4bbc-9737-dc580ac5a12f'; // Deepl API 키를 여기에 입력
  var deeplEndpoint = 'https://api.deepl.com/v2/translate'; // Deepl API 엔드포인트

  // 번역할 언어 코드 설정 (한국어로 고정)
  var targetLang = 'KO';

  return fetch(deeplEndpoint + '?auth_key=' + deeplAPIKey + '&text=' + encodeURIComponent(text) + '&source_lang=' + detectedLang + '&target_lang=' + targetLang)
      .then(response => response.json())
      .then(data => {
          if (data.translations && data.translations.length > 0 && data.translations[0].text) {
              // 번역된 텍스트에 줄바꿈 추가
              var translatedText = data.translations[0].text.replace(/\n/g, '<br>');
              //console.log("Translated text: " + translatedText);
              return translatedText;
          } else {
              throw new Error('Unexpected response from DeepL API');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          throw error; // sendMessage 함수에서 추가 처리를 위해 오류를 다시 던집니다
      });
}

async function translateMsg(text, sourceLang, targetLang) {
  var deeplAPIKey = '929fcdd7-b79a-4bbc-9737-dc580ac5a12f'; // Deepl API 키를 여기에 입력
  var deeplEndpoint = 'https://api.deepl.com/v2/translate'; // Deepl API 엔드포인트
  try {
      var response = await fetch(deeplEndpoint + '?auth_key=' + deeplAPIKey + '&text=' + encodeURIComponent(text) + '&source_lang=' + sourceLang + '&target_lang=' + targetLang);
      var data = await response.json();
      if (data.translations && data.translations.length > 0 && data.translations[0].text) {
          // 번역된 텍스트에 줄바꿈 추가
          var translatedText = data.translations[0].text.replace(/\n/g, '<br>');
          return translatedText;
      } else {
          throw new Error('Unexpected response from DeepL API');
      }
  } catch (error) {
      console.error('Error:', error);
      throw error;
  }
}

async function changeLanguage(targetLang) {
  currentLanguage = targetLang;
  const messages = document.querySelectorAll('.chat-messages .received'); // Get all received message elements

  // 배열에 각 번역 작업의 Promise를 저장할 배열
  const translationPromises = [];

  for (let messageElement of messages) {
    const messageText = messageElement.textContent.trim(); // Get the text content of the message element

    // 각 번역 작업을 Promise로 감싸어 배열에 저장
    translationPromises.push(new Promise(async (resolve, reject) => {
      try {
        let translatedText;
        if (targetLang === 'eng') {
          var detectedLang = await detectLanguage(messageText);
          translatedText = await translateMsg(messageText, detectedLang, 'EN');
        } else if (targetLang === 'kor') {
          var detectedLang = await detectLanguage(messageText);
          translatedText = await translateMsg(messageText, detectedLang, 'KO');
        } else if (targetLang === 'jap') {
          var detectedLang = await detectLanguage(messageText);
          translatedText = await translateMsg(messageText, detectedLang, 'JA');
        } else if (targetLang === 'chi') {
          var detectedLang = await detectLanguage(messageText);
          translatedText = await translateMsg(messageText, detectedLang, 'ZH');
        }
        resolve(translatedText);
      } catch (error) {
        reject(error);
      }
    }));
  }

  // 모든 번역 작업을 병렬로 실행하고 결과를 기다림
  try {
    const translatedMessages = await Promise.all(translationPromises);

    // 각 메시지에 대해 번역된 텍스트를 적용
    for (let i = 0; i < messages.length; i++) {
      const translatedText = translatedMessages[i];
      messages[i].innerHTML = translatedText.replace(/\n/g, '<br>'); // Update the message with the translated text
    }
  } catch (error) {
    console.error('Error translating messages:', error);
  }
}



const loggedInEmail = decodeURIComponent(localStorage.getItem('loggedInEmail'));
console.log(loggedInEmail);

// Function to generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Generate room ID
//const room = generateUUID();
async function getRoomId(email) {
  const url = 'http://spacechat.co.kr:60000/get_room_id';
  try {
    console.log(email);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      const data = await response.json();
      const room = data.room_id;
      console.log("Room ID:", room);
      loadPreviousMessages(room);
      return room;
    } else {
      console.log("Room ID not found for email:", email);
      // Handle the case where room ID is not found
      return generateUUID(); // Generate a new room ID
    }
  } catch (error) {
    console.error('Error fetching room ID:', error);
    // Handle error
    return null;
  }
}

async function loadPreviousMessages(room_id) {
  console.log("새로고침 했을 때");
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
      const messagesDiv = document.getElementById('messages');
      for (const msg of messages) {
          const messageElement = document.createElement('div');
          const originalMessage = translatedMessages[msg.id] || msg.message;
          messageElement.innerText = `${originalMessage}`;
          if (msg.sender !== 'Manager') {  //customer
              messageElement.classList.add('sent');
              messagesDiv.appendChild(messageElement);    
          } else {  //manager
              messageElement.classList.add('received');
              messagesDiv.appendChild(messageElement);
          }
      }
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
  } else {
      console.log('Failed to load previous messages for room ID:', room_id);
    }
  } catch (error) {
    console.error('Error loading previous messages:', error);
    // Handle error
  }
}

// Socket.io connection
const socket = io('http://spacechat.co.kr:60000');
// Send room ID to the server
//socket.emit('room_id', room);

socket.on('connect', async function() {
  if (loggedInEmail === 'None') {
    room = "guest";
    console.log(room);
  }
  else {
    room = await getRoomId(loggedInEmail);
    console.log(room);
  }
  console.log(room);
  socket.emit('room_id', room); // Emit room_id to the server
  socket.emit('join', { username: 'Customer', room });
});

socket.on('message', async function(data) {
    const messages = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.innerText = data.message;
    const messageTextCus = messageElement.innerText;
    // Check if the message is from the Manager
    if (data.sender === 'Manager') {
      messageElement.classList.add('received'); // Apply the 'received' class for manager messages
      //console.log("Received Msg from Manager: "+messageElement);
      const messageText = messageElement.innerText;
      console.log("관리자가 보낸 Msg: "+ messageText); // Log the message text
      
      //관리자가 보낸 메세지 선택한 언어로 번역해서 고객에게 보여줌
      if (messageText) {
        // Translate if current language is not Korean
        if (currentLanguage === 'eng') {
          try {
            const translatedManager = await translateMsg(messageText, 'KO', 'EN');
            console.log("영어 번역 후: "+translatedManager);
            messageElement.innerHTML = translatedManager.replace(/\n/g, '<br>');
          } catch (error) {
            console.error('Error:', error);
          }
        }
        if (currentLanguage === 'kor') {
          try {
            //const translatedManager = await translateMsg(messageText, 'KO', 'KO');
            messageElement.innerHTML = messageText.replace(/\n/g, '<br>');
          } catch (error) {
            console.error('Error:', error);
          }
        }
        if (currentLanguage === 'jap') {
          try {
            const translatedManager = await translateMsg(messageText, 'KO', 'JA');
            messageElement.innerHTML = translatedManager.replace(/\n/g, '<br>');
          } catch (error) {
            console.error('Error:', error);
          }
        }
        if (currentLanguage === 'chi') {
          try {
            const translatedManager = await translateMsg(messageText, 'KO', 'ZH');
            messageElement.innerHTML = translatedManager.replace(/\n/g, '<br>');
          } catch (error) {
            console.error('Error:', error);
          }
        }
      }
      messages.appendChild(messageElement);
      messages.scrollTop = messages.scrollHeight;

    } else {
      console.log("이게 몰까?"+messageTextCus);
      messages.scrollTop = messages.scrollHeight;

      messageElement.classList.add('sent'); // Apply the 'sent' class for customer messages
      // Do not append the message element for non-manager messages
    }

});

async function sendMessage(message) {

  const messageId = generateUUID();
  // Store the message ID along with the message
  translatedMessages[messageId] = message;

  const url = 'http://spacechat.co.kr:60000/save_message';
  const data = { room: room, message: message, sender: loggedInEmail };
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
      // Handle success if needed
      // Scroll to the bottom of the chat window
      //const messagesDiv = document.getElementById('messages');
      //messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } else {
      console.error('Failed to send message:', response.statusText);
      // Handle failure if needed
    }
  } catch (error) {
    console.error('Error sending message:', error);
    // Handle error
  }

  var detectedLang = await detectLanguage(message);
  var translatedCusMsgKor = await translateKor(detectedLang, message);

  socket.emit('message', { room: room, message: translatedCusMsgKor, sender: loggedInEmail });
}


document.getElementById('messageInput').addEventListener('keyup', async function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    const messageInput = document.getElementById('messageInput');
    //await loadPreviousMessages(room_id, messageInput);  //원본 메세지 전달
    const message = messageInput.value.trim(); // Remove whitespace
    if (message) {
      console.log("관리자에게 보내는 Msg 원본: "+message); //customer가 보내는 Msg 
      //--------------------------------------------------------------------
      // Store the original message in the messageInput element
      //messageInput.setAttribute('data-original-message', message);
      // Display the original message in the chat window
      const messagesDiv = document.getElementById('messages');
      const messageElement = document.createElement('div');
      messageElement.innerText = message;
      messageElement.classList.add('sent'); // Apply the 'sent' class for customer messages
      messagesDiv.appendChild(messageElement); //입력한 그대로 화면에 보여짐.
      //----------------------------------------------------------------------
 //     var detectedLang = await detectLanguage(message);
  //    var translatedCusMsgKor = await translateKor(detectedLang, message);
  //    console.log("관리자에게 보내는 Msg 한국어로 번역 후: "+translatedCusMsgKor);
      sendMessage(message);
      messageInput.value = '';
    }
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const languageIcon = document.querySelector('.menu-icon');
  const exitIcon = document.querySelector('#exit-icon');
  const sidebar = document.querySelector('#sidebar');
  const overlay = document.querySelector('.overlay');
  const profileIcon = document.querySelector('.profile-icon');

  if (profileIcon) { // profile-icon 요소가 존재하는지 확인합니다
    const profileImageUrl = `http://spacechat.co.kr:60000/get_profile_image?email=${loggedInEmail}`;

    try {
      const profileImageResponse = await fetch(profileImageUrl);
      const profileImageData = await profileImageResponse.json();

      if (profileImageData.image) {
        console.log("Profile image data:", profileImageData);
        profileIcon.style.backgroundImage = `url(data:image/png;base64,${profileImageData.image})`;
      } else {
        console.log("No profile image found, setting default.");
        profileIcon.style.backgroundImage = "url('profile-icon.png')";
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
      profileIcon.style.backgroundImage = "url('profile-icon.png')";
    }
  } else {
    console.error('Profile icon element not found in the DOM.');
  }



  // Function to close the sidebar
  function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.style.display = 'none';
  }

  languageIcon.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.style.display = 'block'; // Show the overlay
  });

  exitIcon.addEventListener('click', () => {
      // closeSidebar();
      window.location.href = 'chat.html'; // Redirect to index.html
  });

  overlay.addEventListener('click', () => {
      closeSidebar();
  });

  profileIcon.addEventListener('click', () => {
    if (loggedInEmail === 'None') {
      window.location.href = 'login.html';      
    } else {
      window.location.href = 'mypage.html?email=' + loggedInEmail;
    }
  });

});

// 언어 선택 버튼의 onclick 이벤트 핸들러
document.getElementById('kor-btn').addEventListener('click', function() {
  console.log('한국어버튼 누름');
  changeLanguage('kor');  //target language를 kor로!
  document.getElementById('language-icon').style.backgroundImage = "url('kr-icon.png')";
});
document.getElementById('eng-btn').addEventListener('click', function() {
  console.log('영어버튼 누름');
  changeLanguage('eng');
  currentLanguage = 'eng'
  document.getElementById('language-icon').style.backgroundImage = "url('eng-icon.png')";
});
document.getElementById('jap-btn').addEventListener('click', function() {
  console.log('일본어버튼 누름');
  changeLanguage('jap');
  document.getElementById('language-icon').style.backgroundImage = "url('jp-icon.png')";
});
document.getElementById('chi-btn').addEventListener('click', function() {
  console.log('중국어버튼 누름');
  changeLanguage('chi');
  document.getElementById('language-icon').style.backgroundImage = "url('ch-icon.png')";
});


document.getElementById('language-icon').style.backgroundImage = "url('default-icon.png')";

// language-icon 클릭 시 순서대로 한국어, 영어, 일본어, 중국어로 번역되고 아이콘도 각 언어에 맞게 변경
document.getElementById('language-icon').addEventListener('click', function() {
    var currentIcon = document.getElementById('language-icon').style.backgroundImage;
    if (currentIcon.includes('default-icon.png')) {
        changeLanguage('kor');
        document.getElementById('language-icon').style.backgroundImage = "url('kr-icon.png')";
    } else if (currentIcon.includes('kr-icon.png')) {
        changeLanguage('eng');
        document.getElementById('language-icon').style.backgroundImage = "url('eng-icon.png')";
    } else if (currentIcon.includes('eng-icon.png')) {
        changeLanguage('jap');
        document.getElementById('language-icon').style.backgroundImage = "url('jp-icon.png')";
    } else if (currentIcon.includes('jp-icon.png')) {
        changeLanguage('chi');
        document.getElementById('language-icon').style.backgroundImage = "url('ch-icon.png')";
    } else if (currentIcon.includes('ch-icon.png')) {
        changeLanguage('kor');
        document.getElementById('language-icon').style.backgroundImage = "url('kr-icon.png')";
    }
});