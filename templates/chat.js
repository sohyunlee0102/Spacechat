var my_id = '0';
var my_ai_pre_message = '';
var userEmail = '';
var currentLanguage = 'kor'; // 현재 언어 설정
var promptText = '';

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

var placeholderDateKor = '날짜를 선택하세요';
var placeholderDateEng = 'Select a date';
var placeholderDateJap = '日付を選択してください';
var placeholderDateChi = '选择日期';

var messagePlaceholderKor = '메시지를 입력하세요';
var messagePlaceholderEng = 'Enter your message';
var messagePlaceholderJap = 'メッセージを入力してください';
var messagePlaceholderChi = '输入你的信息';

//날짜를 선택하세요 번역
function getPlaceholderText() {
    switch (currentLanguage) {
        case 'eng':
            return placeholderDateEng;
        case 'jap':
            return placeholderDateJap;
        case 'chi':
            return placeholderDateChi;
        case 'kor':
        default:
            return placeholderDateKor;
    }
}
//메세지를 입력하세요 번역 
function getPlaceholderTextForInput() {
    var messageInput = document.getElementById('message-input');
    switch (currentLanguage) {
        case 'eng':
            messageInput.placeholder = messagePlaceholderEng;
            break;
        case 'jap':
            messageInput.placeholder = messagePlaceholderJap;
            break;
        case 'chi':
            messageInput.placeholder = messagePlaceholderChi;
            break;
        case 'kor':
        default:
            messageInput.placeholder = messagePlaceholderKor;
    }
}
//수정됨
async function changeLanguage(targetLang) {
    currentLanguage = targetLang;
    const messages = document.querySelectorAll('.message.ai'); // 모든 수신된 메시지 요소 가져오기
    const buttons = document.querySelectorAll('.menu-button'); // 모든 메뉴 버튼 요소 가져오기
    const messagesCus = document.querySelectorAll('.message.customer');
    // 배열에 각 번역 작업의 Promise를 저장할 배열
    const translationPromises = [];
    const translationPromises2 = [];


    // 메시지 번역 작업을 Promise에 추가
    for (let messageElement of messages) {
        const messageText = messageElement.textContent.trim(); // 메시지 요소의 텍스트 내용 가져오기

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

    // 버튼 텍스트 번역 작업을 Promise에 추가
    for (let button of buttons) {
        const buttonText = button.textContent.trim(); // 버튼 요소의 텍스트 내용 가져오기

        // 각 번역 작업을 Promise로 감싸어 배열에 저장
        translationPromises.push(new Promise(async (resolve, reject) => {
            try {
                let translatedText;
                if (targetLang === 'eng') {
                    var detectedLang = await detectLanguage(buttonText);
                    translatedText = await translateMsg(buttonText, detectedLang, 'EN');
                } else if (targetLang === 'kor') {
                    var detectedLang = await detectLanguage(buttonText);
                    translatedText = await translateMsg(buttonText, detectedLang, 'KO');
                } else if (targetLang === 'jap') {
                    var detectedLang = await detectLanguage(buttonText);
                    translatedText = await translateMsg(buttonText, detectedLang, 'JA');
                } else if (targetLang === 'chi') {
                    var detectedLang = await detectLanguage(buttonText);
                    translatedText = await translateMsg(buttonText, detectedLang, 'ZH');
                }
                resolve(translatedText);
            } catch (error) {
                reject(error);
            }
        }));
    }
    
    var dateWidget = document.getElementById('date-widget');
    if (dateWidget) { //날짜를 선택하세요 
        dateWidget.setAttribute('placeholder', getPlaceholderText()); 
    }
    getPlaceholderTextForInput();  //메세지를 입력하세요

    var detectedStartMsg = await detectLanguage(promptText);
    var promptarr = [
        await translateMsg(promptText, detectedStartMsg, 'EN'), 
        await translateMsg(promptText, detectedStartMsg, 'KO'),
        await translateMsg(promptText, detectedStartMsg, 'JA'),
        await translateMsg(promptText, detectedStartMsg, 'ZH')
    ]; // 번역된 결과를 저장할 배열

    // 메시지 번역 작업을 Promise에 추가
    for (let messageElement of messagesCus) {
        const messageText = messageElement.textContent.trim(); // 메시지 요소의 텍스트 내용 가져오기

        // 각 메시지의 텍스트가 promptarr에 있는 경우에만 번역 작업을 수행하도록 조건 추가
        if (promptarr.includes(messageText)) {
            console.log("프롬프트 메세지: "+messageText);
            // 각 번역 작업을 Promise로 감싸어 배열에 저장
            translationPromises2.push(new Promise(async (resolve, reject) => {
                try {
                    let translatedText;
                    if (targetLang === 'eng') {
                        var detectedLang = await detectLanguage(messageText);
                        translatedText = await translateMsg(messageText, detectedLang, 'EN');
                        console.log("번역 후: "+translatedText);
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
    }
    // 모든 번역 작업을 병렬로 실행하고 결과를 기다림
    try {
        const translatedTexts = await Promise.all(translationPromises);
        const translatedTexts2 = await Promise.all(translationPromises2);

        // 각 메시지에 대해 번역된 텍스트를 적용
        let messageIndex = 0;
        for (let messageElement of messages) {
            messageElement.innerHTML = translatedTexts[messageIndex].replace(/\n/g, '<br>'); // 메시지를 번역된 텍스트로 업데이트
            messageIndex++;
        }

        // 각 버튼에 대해 번역된 텍스트를 적용
        let buttonIndex = messages.length;
        for (let button of buttons) {
            button.textContent = translatedTexts[buttonIndex];
            buttonIndex++;
        }
        // 각 메시지에 대해 번역된 텍스트를 적용
        let messageIndex2 = 0;
        for (let messageElement of messagesCus) {
            // 번역된 텍스트를 메시지 요소에 추가
            messageElement.innerHTML = translatedTexts2[messageIndex2].replace(/\n/g, '<br>'); 
            messageIndex2++;
        }

    } catch (error) {
        console.error('Error translating messages:', error);
    }
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

// Button translations
var buttonTranslations = {
    'eng': {
        '예약하기': 'Make an appointment',
        '문의하기': 'Contact us',
        '관리자와 채팅하기': 'Chat with an admin',
        '예': 'YES',
        '아니오': 'NO'
    },
    'kor': {
        '예약하기': '예약하기',
        '문의하기': '문의하기',
        '관리자와 채팅하기': '관리자와 채팅하기',
        '예': '예',
        '아니오': '아니오'
    },
    'jap': {
        '예약하기': '予約する',
        '문의하기': 'お問い合わせ',
        '관리자와 채팅하기': '管理者とチャットする',
        '예': 'はい',
        '아니오': 'いいえ'
    },
    'chi': {
        '예약하기': '预约',
        '문의하기': '联系我们',
        '관리자와 채팅하기': '与管理员聊天',
        '예': '是的',
        '아니오': '没有'
    }
};
async function sendMessage(messageToSend = null, selectedDateTime = null, reset = false) {
    var chatContainer = document.getElementById('chat-container');
    var messageInput = document.getElementById('message-input');
    var message = (messageToSend || messageInput.value).trim();

    if (reset) {
        my_id = '0';
    }
    if (message) {
        var customerMsg = document.createElement('div');
        customerMsg.classList.add('message', 'customer');
        customerMsg.innerHTML = message.replace(/\n/g, '<br>');
        console.log("customer Msg: " + message);
        chatContainer.appendChild(customerMsg);

        var cusTranMsg = message;
        var detectedLang = await detectLanguage(message);
        try {
            // 메시지를 한국어로 번역
            console.log(detectedLang);
            cusTranMsg = await translateKor(detectedLang, message);
            console.log("서버에 보낼 customer Msg: "+cusTranMsg);
        } catch (error) {
            console.error('Error:', error);
        }

        var url = `http://spacechat.co.kr:60000/send_message/?my_id=${my_id}&email=${encodeURIComponent(userEmail)}&message=${encodeURIComponent(cusTranMsg)}&my_ai_pre_message=${my_ai_pre_message}&selectedDateTime=${selectedDateTime}`;

        try {
            var response = await fetch(url);
            var data = await response.json();
            if (!reset) {
                my_id = data.my_id;
                my_ai_pre_message = data.return_message;
            }

            // AI message 처리
            var aiMessageContainer = document.createElement('div');
            aiMessageContainer.classList.add('ai-message-container');

            var aiIcon = document.createElement('div');
            aiIcon.classList.add('ai-icon');
            aiMessageContainer.appendChild(aiIcon);

            var aiMsg = document.createElement('div');
            aiMsg.classList.add('message', 'ai');

            if (data.status === 'success' && data.message === 'chat_with_manager') {
                window.location.href = 'customer.html';
            }

            if (data.return_message) {
                aiMsg.innerHTML = data.return_message.replace(/\n/g, '<br>');
                var detectedLang = await detectLanguage(data.return_message);

                if (currentLanguage === 'eng') {
                    try {
                        var translatedAI = await translateMsg(data.return_message, detectedLang, 'EN');
                        aiMsg.innerHTML = translatedAI.replace(/\n/g, '<br>');
                    } catch (error) {
                        console.error('Error:', error);
                    }
                } else if (currentLanguage === 'jap') {
                    try {
                        var translatedAI = await translateMsg(data.return_message, detectedLang, 'JA');
                        aiMsg.innerHTML = translatedAI.replace(/\n/g, '<br>');
                    } catch (error) {
                        console.error('Error:', error);
                    }
                } else if (currentLanguage === 'chi') {
                    try {
                        var translatedAI = await translateMsg(data.return_message, detectedLang, 'ZH');
                        aiMsg.innerHTML = translatedAI.replace(/\n/g, '<br>');
                    } catch (error) {
                        console.error('Error:', error);
                    }
                } else if (currentLanguage === 'kor') {
                    try {
                        var translatedAI = await translateMsg(data.return_message, detectedLang, 'KO');
                        aiMsg.innerHTML = translatedAI.replace(/\n/g, '<br>');
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
            }

            if (data.prediction) {
                const modelResponse = data.prediction;
                console.log("문의하기 답변 원본: " + modelResponse);
                var detectedLang = await detectLanguage(data.prediction);
                var modelMsgElement = document.createElement('div');
                modelMsgElement.classList.add('message', 'ai');
                modelMsgElement.innerHTML = modelResponse.replace(/\n/g, '<br>');
                //aiMessageContainer.appendChild(modelMsgElement);

                if (currentLanguage === 'eng') {
                    try {
                        var translatedAI = await translateMsg(data.prediction, detectedLang, 'EN');
                        modelMsgElement.innerHTML = translatedAI.replace(/\n/g, '<br>');
                    } catch (error) {
                        console.error('Error:', error);
                    }
                } else if (currentLanguage === 'jap') {
                    try {
                        var translatedAI = await translateMsg(data.prediction, detectedLang, 'JA');
                        modelMsgElement.innerHTML = translatedAI.replace(/\n/g, '<br>');
                    } catch (error) {
                        console.error('Error:', error);
                    }
                } else if (currentLanguage === 'chi') {
                    try {
                        var translatedAI = await translateMsg(data.prediction, detectedLang, 'ZH');
                        modelMsgElement.innerHTML = translatedAI.replace(/\n/g, '<br>');
                    } catch (error) {
                        console.error('Error:', error);
                    }
                } else if (currentLanguage === 'kor') {
                    try {
                        var translatedAI = await translateMsg(data.prediction, detectedLang, 'KO');
                        modelMsgElement.innerHTML = translatedAI.replace(/\n/g, '<br>');
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }

                aiMessageContainer.appendChild(modelMsgElement);
            } else {
                // 수정: AI 메시지를 한 번만 추가
                aiMessageContainer.appendChild(aiMsg);
            }

            chatContainer.appendChild(aiMessageContainer);

            //var menuItems = (data.return_menu && typeof data.return_menu === 'string') ? data.return_menu.split(',') : [];

            //console.log(menuItems);

            // 이제 메뉴 아이템을 보여주는 sendMessage 함수 내부에 번역된 메뉴 아이템을 사용할 수 있습니다.
            var menuItems = (data.return_menu && typeof data.return_menu === 'string') ? data.return_menu.split(',') : [];
            

            if (menuItems.includes('날짜위젯')) {
                handleDateWidget();
            } else if (menuItems.length > 0) {
                var menuContainer = document.createElement('div');
                menuContainer.classList.add('menu-container');

                if (currentLanguage === 'eng') {
                    try {
                        menuItems = await Promise.all(menuItems.map(async function(item) {
                            var translatedItem = await translateMsg(item.trim(), detectedLang, 'EN');
                            return translatedItem;
                        }));
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
                if (currentLanguage === 'kor') {
                    try {
                        menuItems = await Promise.all(menuItems.map(async function(item) {
                            var translatedItem = await translateMsg(item.trim(), detectedLang, 'KO');
                            return translatedItem;
                        }));
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
                if (currentLanguage === 'jap') {
                    try {
                        menuItems = await Promise.all(menuItems.map(async function(item) {
                            var translatedItem = await translateMsg(item.trim(), detectedLang, 'JA');
                            return translatedItem;
                        }));
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
                if (currentLanguage === 'chi') {
                    try {
                        menuItems = await Promise.all(menuItems.map(async function(item) {
                            var translatedItem = await translateMsg(item.trim(), detectedLang, 'ZH');
                            return translatedItem;
                        }));
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }

                menuItems.forEach(item => {
                    var button = document.createElement('button');
                    button.textContent = item.trim();
                    button.classList.add('menu-button');
                    button.onclick = function() {sendMessage(item.trim()); };
                    menuContainer.appendChild(button);

                    
                });

                // 메뉴 아이템을 변경된 버튼으로 교체
                chatContainer.appendChild(menuContainer); // 변경된 메뉴 컨테이너를 채팅 컨테이너에 추가합니다.
            }
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        catch (error) {
            console.error('Error:', error);
            var errorMsg = document.createElement('div');
            errorMsg.classList.add('message', 'error');
            errorMsg.textContent = '오류 발생: ' + error;
            chatContainer.appendChild(errorMsg);
        }

        if (!messageToSend) {
            messageInput.value = '';
        }
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function handleAvailableTimes(times) {
    var availableTimes = times.split(',');
    flatpickr(dateWidget, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        onClose: function(selectedDates, dateStr, instance) {
            // Logic for handling selected date and time
        },
        disable: availableTimes.map(function(time) {
            return function(date) {
                var hour = date.getHours();
                var minute = date.getMinutes();
                return availableTimes.indexOf(`${hour}:${minute}`) === -1;
            }
        })
    });
}



function handleDateWidget() {
    var chatContainer = document.getElementById('chat-container');
    var dateWidget = document.createElement('input');
    dateWidget.setAttribute('type', 'text');
    dateWidget.setAttribute('id', 'date-widget');
    //dateWidget.setAttribute('placeholder', placeholderDateKor);
    dateWidget.setAttribute('placeholder', getPlaceholderText());

    chatContainer.appendChild(dateWidget);

    var timeButtonsContainer = document.createElement('div');
    timeButtonsContainer.classList.add('time-buttons-container');
    chatContainer.appendChild(timeButtonsContainer);

    var confirmButton = document.createElement('button');
    confirmButton.textContent = 'OK';
    confirmButton.classList.add('menu-button');
    confirmButton.disabled = true;
    chatContainer.appendChild(confirmButton);

    confirmButton.addEventListener('click', function() {
        var selectedDateTime = dateWidget.value;
        sendMessage('OK', selectedDateTime);
    });

    function checkEnableConfirmButton() {
        if (dateWidget.value && dateWidget.value.split(' ').length === 2) {
            confirmButton.disabled = false;
        } else {
            confirmButton.disabled = true;
        }
    }

    function createTimeButtons(selectedDate) {
        var now = new Date();
        var minHour = selectedDate.getDate() === now.getDate() ? now.getHours() : 10;
        var maxHour = selectedDate.getDate() === now.getDate() ? 21 : 21; // Max hour set to 21 (9 PM)
        timeButtonsContainer.innerHTML = ''; // Clear previous buttons

        for (var hour = minHour; hour <= maxHour; hour++) {
            for (var minute = 0; minute < 60; minute += 60) {
                if (selectedDate.getDate() === now.getDate() && hour === now.getHours() && minute < now.getMinutes()) {
                    continue;
                }
                var timeButton = document.createElement('button');
                timeButton.textContent = `${hour < 10 ? '0' + hour : hour}:${minute === 0 ? '00' : minute}`;
                timeButton.classList.add('time-button');
                timeButton.onclick = function() {
                    var selectedTime = this.textContent;
                    var dateValue = dateWidget.value.split(' ')[0];
                    dateWidget.value = `${dateValue} ${selectedTime}`;
                    checkEnableConfirmButton();
                };
                timeButtonsContainer.appendChild(timeButton);
            }
        }
    }
    var now = new Date();
    var minDate = now.getHours() >= 21 ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
    flatpickr(dateWidget, {
        enableTime: false,
        dateFormat: "Y-m-d",
        minDate: minDate,
        maxDate: new Date().fp_incr(30),
        onClose: function(selectedDates, dateStr, instance) {
            confirmButton.disabled = true;
            var selectedDate = new Date(dateStr);
            createTimeButtons(selectedDate);
        }
    });

    if (now.getHours() < 21) {
        createTimeButtons(now);
    }
}

var placeholderDateKor = '날짜를 선택하세요';
var placeholderDateEng = 'Select a date';
var placeholderDateJap = '日付を選択してください';
var placeholderDateChi = '选择日期';

var messagePlaceholderKor = '메시지를 입력하세요';
var messagePlaceholderEng = 'Enter your message';
var messagePlaceholderJap = 'メッセージを入力してください';
var messagePlaceholderChi = '输入你的信息';
//날짜를 선택하세요 번역
function getPlaceholderText() {
    switch (currentLanguage) {
        case 'eng':
            return placeholderDateEng;
        case 'jap':
            return placeholderDateJap;
        case 'chi':
            return placeholderDateChi;
        case 'kor':
        default:
            return placeholderDateKor;
    }
}
//메세지를 입력하세요 번역 
function getPlaceholderTextForInput() {
    var messageInput = document.getElementById('message-input');
    switch (currentLanguage) {
        case 'eng':
            messageInput.placeholder = messagePlaceholderEng;
            break;
        case 'jap':
            messageInput.placeholder = messagePlaceholderJap;
            break;
        case 'chi':
            messageInput.placeholder = messagePlaceholderChi;
            break;
        case 'kor':
        default:
            messageInput.placeholder = messagePlaceholderKor;
    }
}

/*
//수정
//프로필 변경
// Function to update the profile icon with the stored profile photo URL
function updateProfileIcon() {
    const profilePhotoURL = localStorage.getItem('profilePhotoURL');
    if (profilePhotoURL) {
        const profileIcon = document.getElementById('profile-icon');
        profileIcon.src = profilePhotoURL;
    }
}
*/

// Exit icon 클릭 시 index.html로 리디렉션
document.getElementById('exit-icon').addEventListener('click', function() {
    window.location.href = 'index.html';
});

document.getElementById('send-btn').addEventListener('click', () => {
    console.log('send-btn');
    sendMessage();
});

document.getElementById('message-input').addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        //console.log('message-input');
        sendMessage();
    }
});

// overlay 클릭 시 사이드바 닫기
overlay.addEventListener('click', function() {
    sidebar.style.right = '-250px';
    overlay.style.display = 'none';
});

window.onload = async function() {
    //수정, 프로필 추가
 //   updateProfileIcon();
    userEmail = new URLSearchParams(window.location.search).get('email');
    console.log("Loaded userEmail:", userEmail);
    promptText = userEmail ? userEmail + " 님 입장했습니다" : "비회원으로 입장했습니다.";

    try {
        const profileImageResponse = await fetch(`http://spacechat.co.kr:60000/get_profile_image?email=${encodeURIComponent(userEmail)}`);
        const profileImageData = await profileImageResponse.json();
        console.log("Profile image data:", profileImageData); // 추가
        console.log(profileImageData.profileImage)
        const profileIcon = document.getElementById('profile-icon');

        if (profileImageData.image) {
            console.log("HERE");
            // 프로필 이미지가 있는 경우
            profileIcon.style.backgroundImage = `url(data:image/png;base64,${profileImageData.image})`;
        } else {
            // 프로필 이미지가 없는 경우 디폴트 아이콘 설정
            profileIcon.style.backgroundImage = "url('profile-icon.png')";
        }
    } catch (error) {
        console.error('Error fetching profile image:', error);
        // 프로필 이미지 가져오는 데 문제가 있을 경우 디폴트 아이콘 설정
        profileIcon.style.backgroundImage = "url('profile-icon.png')";
    }

    sendMessage(promptText, false);

    // 햄버거 아이콘 클릭 시 사이드바 토글
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('overlay');
    var menuIcon = document.getElementById('menu-icon');

    menuIcon.addEventListener('click', function() {
        if (sidebar.style.right === '0px') {
            sidebar.style.right = '-250px';
            overlay.style.display = 'none';
        } else {
            sidebar.style.right = '0';
            overlay.style.display = 'block';
        }
    });

    // 페이지 로드 후 햄버거 아이콘이 눌린 상태로 설정
    menuIcon.click(); 

    // Side menu가 열릴 때 Home 화면의 menu-icon을 숨김
    sidebar.addEventListener('transitionend', function() {
        if (sidebar.style.right === '0px') {
            menuIcon.style.display = 'none';
        } else {
            menuIcon.style.display = 'block';
        }
    });

    var profileIcon = document.getElementById('profile-icon');
    profileIcon.addEventListener('click', function() {
        if (userEmail) {
            window.location.href = 'mypage.html?email=' + userEmail;
        } else {
            window.location.href = 'login.html';
        }
    });
};


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

// 초기 위젯 설정
//handleDateWidget();

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