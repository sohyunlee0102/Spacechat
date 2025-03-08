// agree 라디오 버튼 클릭 이벤트 리스너
document.getElementById('agree').addEventListener('change', function() {
    var nextButton = document.getElementById('nextButton');

    // agree 선택 시 Next 버튼 활성화
    if (this.checked) {
        nextButton.disabled = false;
    }
});

// disagree 라디오 버튼 클릭 이벤트 리스너
document.getElementById('disagree').addEventListener('change', function() {
    var nextButton = document.getElementById('nextButton');

    // disagree 선택 시 Next 버튼 비활성화
    if (this.checked) {
        nextButton.disabled = true;
    }
});

// Next 버튼 클릭 시 signup.html로 이동
document.getElementById('nextButton').addEventListener('click', function() {
    window.location.href = 'signup.html';
});