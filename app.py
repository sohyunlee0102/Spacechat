from flask import Flask, session, request, Response, url_for, redirect, render_template
import urllib.request
from flask_mysqldb import MySQL
#from flaskext.mysql import MySQL
from flask_cors import CORS, cross_origin
import pymysql
#import bcrypt
import requests

from flask import Flask, request, send_file, jsonify
import os
import uuid
import traceback
from datetime import datetime
from flask_mail import Mail, Message
import random

import datetime as dt
from datetime import date, datetime
import base64

import json
from json import JSONEncoder
import datetime
from datetime import timedelta
from dateutil.relativedelta import relativedelta
import re
import hashlib
import string
import random
import logging
import traceback
import tensorflow as tf
import numpy as np
from transformer import transformer, START_TOKEN, END_TOKEN, tokenizer, MAX_LENGTH, model
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from google.oauth2 import id_token
from google.auth.transport import requests
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

#logging.basicConfig(filename='/home/ubuntu/capstone/log/app.log', level=logging.DEBUG, format='%(asctime)s:%(levelname)s:%(message)s')

logging.debug('This is a debug message')

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=365)
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='None',
)
CORS(app, supports_credentials=True, origins="*")
socketio = SocketIO(app, async_mode='gevent', cors_allowed_origins=['http://spacechat.co.kr', 'http://spacechat.co.kr:60000', '*'])
app.logger.setLevel(logging.INFO)

app.config['MYSQL_DATABASE_USER']     = ''
app.config['MYSQL_DATABASE_PASSWORD'] = ''
app.config['MYSQL_DATABASE_DB']       = ''
app.config['MYSQL_DATABASE_HOST']     = ''

GOOGLE_CLIENT_ID = ''  # Replace with your Google Client ID
GOOGLE_CLIENT_SECRET = ''  # Replace with your Google Client Secret
SCOPES = ['https://www.googleapis.com/auth/calendar.events']

mysql = MySQL()
mysql.init_app(app)

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

crm_config = {
    'user': app.config['MYSQL_DATABASE_USER'],
    'password': app.config['MYSQL_DATABASE_PASSWORD'],
    'database': app.config['MYSQL_DATABASE_DB'],
    'host': app.config['MYSQL_DATABASE_HOST'],
}

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = ''
app.config['MAIL_USERNAME'] = ''
app.config['MAIL_PASSWORD'] = ''
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

mail = Mail(app)



class CDB:
    def __init__(self, db_config):
        self.connection = None
        try:
            self.connection = pymysql.connect(**db_config)
            self.cursor = self.connection.cursor()
        except Exception as e:
            print(f'An error occurred while initializing the database connection: {e}')
            print(traceback.format_exc())
            raise

    def __del__(self):
        try:
            if hasattr(self, 'cursor') and self.cursor is not None:
                self.cursor.close()
            if hasattr(self, 'connection') and self.connection is not None:
                self.connection.close()
        except Exception as e:
            print(f'An error occurred while closing the database connection: {e}')
            print(traceback.format_exc())

    def execute(self, q, p=None):
        if self.connection is None:
            self.connection = pymysql.connect()
        if self.cursor is None:
            self.cursor = self.connection.cursor()
        self.cursor.execute(q, p)
        return self.cursor

    def commit(self):
        self.connection.commit()

    def close(self):
        if self.cursor is not None:
            self.cursor.close()
            self.cursor = None

        if self.connection is not None:
            self.connection.close()
            self.connection = None

@app.route('/google_login', methods=['GET'])
def google_login():
    flow = Flow.from_client_secrets_file(
        "credentials.json",
        scopes=['openid', 'https://www.googleapis.com/auth/userinfo.email'],
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true')
    session['state'] = state
    return redirect(authorization_url)

@app.route('/oauth2callback')
def oauth2callback():
  #  if 'state' not in session:
   #     return redirect(url_for('google_login'))
    state = session['state']
    flow = Flow.from_client_secrets_file(
        "credentials.json",
        scopes=['openid', 'https://www.googleapis.com/auth/userinfo.email'],
        state=state,
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    flow.fetch_token(authorization_response=request.url)
    session['credentials'] = flow.credentials.to_json()
    return redirect(url_for('sync_with_google_calendar'))


@app.route('/sync_with_google_calendar', methods=['GET'])
def sync_with_google_calendar():
    print("HEREE")
    if 'credentials' not in session:
        print("HEREEE")
        return redirect(url_for('google_login'))
    
    credentials = session['credentials']
    service = build('calendar', 'v3', credentials=credentials)
    event = {
        'summary': 'Test Event',
        'start': {
            'dateTime': '2024-06-05T09:00:00',
            'timeZone': 'Asia/Seoul',
        },
        'end': {
            'dateTime': '2024-06-05T10:00:00',
            'timeZone': 'Asia/Seoul',
        },
    }
    event = service.events().insert(calendarId='primary', body=event).execute()
    print('Event created: %s' % (event.get('htmlLink')))
    return 'Event created!'

def credentials_to_dict(credentials):
    return {'token': credentials.token, 'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri, 'client_id': credentials.client_id,
            'client_secret': credentials.client_secret, 'scopes': credentials.scopes}

# 쿠키 설정 엔드포인트
@app.route('/set_cookie')
def set_cookie():
    response = make_response("Setting cookie")
    response.set_cookie('cookie_name', 'cookie_value', domain='.spacechat.co.kr')
    return response

class DateTimeEncoder(JSONEncoder):
        def default(self, obj):
            if isinstance(obj, (datetime.date, datetime.datetime)):
                return obj.isoformat()

def translate_with_deepl(text, target_lang='EN'):
    auth_key = ''  
    url = 'https://api.deepl.com/v2/translate'
    params = {'auth_key': auth_key, 'text': text, 'target_lang': target_lang}
    response = requests.post(url, data=params)

    try:
        if response.status_code == 200:
            return response.json()['translations'][0]['text']
        else:
            # 응답 상태 코드가 성공적이지 않은 경우 오류 메시지 출력
            print(f"Error: {response.status_code}, {response.text}")
            return "Translation failed."
    except requests.exceptions.JSONDecodeError:
        # JSON 파싱 오류 처리
        print("Error parsing JSON response from server.")
        print(f"Response content: {response.text}")  # 서버 응답 내용 출력
        return "Translation failed."
    
def get_current_date_time():
    return datetime.datetime.now().strftime('%a_%d.%b.%Y_%H.%M.%S')

def serialize_datetime(obj):
    return obj.isoformat()
    

def change_dic(cursor, rows):
    column_names = [desc[0] for desc in cursor.description]  # 컬럼 이름 추출
    result_dicts = []  # 각 행을 저장할 리스트 생성
    for row in rows:
        row_dict = {}  # 각 행의 딕셔너리를 생성
        for i, column_value in enumerate(row):
            column_name = column_names[i]  # 컬럼 이름
            # If the value is a string and looks like a time, keep it as a string
            if isinstance(column_value, str) and ':' in column_value:
                # Ensure that this is actually a time string and not a timedelta
                try:
                    # Attempt to parse the string as a time to check its validity
                    dt.datetime.strptime(column_value, '%H:%M').time()
                    # Keep the time string as it is
                except ValueError:
                    # If not a valid time, do not change the format
                    pass
            # Handle other data types as necessary
            elif isinstance(column_value, (dt.date, dt.datetime)):
                column_value = column_value.isoformat()
            elif isinstance(column_value, dt.timedelta):
                column_value = column_value.total_seconds()
            else:
                # For other data types or valid time strings, keep the original value
                pass
            row_dict[column_name] = column_value  # 딕셔너리에 컬럼 이름과 값을 추가
        result_dicts.append(row_dict)  # 행 딕셔너리를 리스트에 추가
    return result_dicts

def select_customer(email):
    print("select_customer-------------------------------------->!")
    if email is None or email == 'null':
        print("select_customer-email is null, returning an empty list!")
        return []
    try:
        _db = CDB(crm_config)   # 데이터베이스 연결 가정
        select_query = """
            SELECT * FROM t_customers WHERE email = %s ;
        """

        # 쿼리 실행
        cursor = _db.execute(select_query, (email))
        row = cursor.fetchone()
        #print(row)
        cursor.close()

        results = change_dic(cursor, [row])  # 딕셔너리로 넘겨준다
        #print(results)
        cursor.close()
        return results
    except Exception as e:
        print(f'-----------------------------------\n{traceback.format_exc()}')
        return results


def insert_temp_reservation(*params):
    print('insert_temp_reservation---------------->')
    if len(params) != 8:
        return []
    id, tel, name, menu, reserv_date, reserv_time, email, pre_message = params
    # 시간을 문자열로 변환하여 저장
    #reserv_time_str = str(reserv_time) if reserv_time else None
    #reserv_time_str = reserv_time.strftime('%H:%M') if reserv_time else None

    try:
        # Assuming CDB is a class that handles your database connection
        #_db = CDB(crm_config)  # Replace with your actual database connection
        # INSERT query - Update on duplicate key
        _db = CDB({
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        })  # Replace with your actual database connection

        query_sta = """
            INSERT INTO Capstone2.t_reservations (
                id, tel, name, email, menu, reserv_date, reserv_time , pre_message
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s , %s
            )
            ON DUPLICATE KEY UPDATE 
                tel = COALESCE(NULLIF(VALUES(tel), ''), tel),
                name = COALESCE(NULLIF(VALUES(name), ''), name),
                email = COALESCE(NULLIF(VALUES(email), ''), email),
                menu = COALESCE(NULLIF(VALUES(menu), ''), menu),
                reserv_date = COALESCE(VALUES(reserv_date), reserv_date),
                reserv_time = COALESCE(VALUES(reserv_time), reserv_time),
                pre_message = COALESCE(NULLIF(VALUES(pre_message), ''), pre_message),
                updated_at = CURRENT_TIMESTAMP;
        """

        cursor = _db.execute(query_sta, (id, tel, name, email, menu, reserv_date, reserv_time, pre_message))
        if cursor.rowcount == 1:
            last_insert_id = _db.execute("SELECT LAST_INSERT_ID();").fetchone()[0]
        else:
            last_insert_id = id
        _db.commit()
        cursor.close()
        return [{"id": last_insert_id}]
    
    except Exception as e:
        _db.rollback()
        print('An error occurred while processing the request.')
        return []

# 데이터베이스 연결 및 쿼리 실행 클래스 (CDB) 및 설정 (crm_config)은 이 예제에서 정의되지 않았습니다.
def find_answer(input_keyword):
    results = []
    if input_keyword == None : return []
    try:
        _db = CDB(crm_config)  # Assuming database connection
        
        # Split the input keyword using comma as a delimiter
        keywords = input_keyword.split(',')
        
        # Generate the LIKE query for each keyword
        like_queries = ' OR '.join(['keyword LIKE %s' for _ in keywords])
        
        # Combine the LIKE queries with OR operator
        select_query = f"""
            SELECT answer
            FROM Capstone2.t_answers
            WHERE {like_queries};
        """
        
        # Add wildcard '%' before and after each keyword for partial matching
        keywords_with_wildcards = ['%' + kw.strip() + '%' for kw in keywords]
        
        # Execute the query with the keywords
        cursor = _db.execute(select_query, tuple(keywords_with_wildcards))
        
        # Fetch all rows containing similar keywords
        rows = cursor.fetchall()
        
        # Extract answers from the rows
        results = [row[0] for row in rows]
        
        cursor.close()
        return results
    except Exception as e:
        print(f'-----------------------------------\n{traceback.format_exc()}')
        return results

def select_reservation(id):
    print('select_reservation--------tttttttttttttttttttttttttttttttttttt----------->')
    results = []
    try:
        _db = CDB(crm_config)   # 데이터베이스 연결 가정
        select_query = """
            SELECT *
            FROM Capstone2.t_reservations
            WHERE id = %s;
        """
        cursor = _db.execute(select_query, (id,))
        rows = cursor.fetchall()

        # Extract column names
        column_names = [column[0] for column in cursor.description]

        for row in rows:
            row_dict = dict(zip(column_names, row))
            # Convert reserv_time to string
            row_dict['reserv_time'] = str(row_dict['reserv_time'])
            results.append(row_dict)

        cursor.close()
        return results
    
    except Exception as e:
        print('An error occurred while processing the request:', e)
        return results



def find_keyword(input_msg):
    KEY_WORD_LIST = ['장소', '위치', '대표']
    
    for keyword in KEY_WORD_LIST:
        if keyword in input_msg:
            return keyword
    
    return None  # 키워드가 없는 경우 None 반환

SHOP_MENU_LIST = ['Personal Color(1:1)', 'Personal Color(2:1)', 'Premium image making(1:1)', 'Premium image making(2:1)', 'Make up+Personal Color(1:1)', 'Make up+Personal Color(2:1)']
DATE_MENU_LIST = [':']
REVERVATION = 'REVERVATION'
TIME_CONFIRM = 'TIME_CONFIRM'
PERSONAL_CONFIRM ='PERSONAL_CONFIRM'
KEYWORDS = ["안녕", "코스", "날짜", "시간","확인","이름","전화","메일","정보","완료","위치","질문"]
TAG_KOR = 'kor'
TAG_ENG = 'eng'
RULES = [
    {
        "previous_message": "처음접속",
        "return_message": '''안녕하세요, 저는 SpaceChat입니다! \n 기본적인 공지사항을 알려드리겠습니다. 우선, 저희는 여러 개의 코스를 가지고 있습니다.\n 
        Personal Color(1:1)\nPersonal Color(2:1)\nPremium image making(1:1)\nPremium image making(2:1)\nMake up+Personal Color(1:1)\nMake up+Personal Color(2:1)\n
        \n예약을 원하시면 예약하기 버튼을, 문의사항이 있으시면 문의하기 버튼을, 관리자 연결을 원하시면 관리자와 채팅 버튼을 눌러주세요.''',
        #"output_menu": "Make a reservation,Ask a Question,Chat with Manager"
        "output_menu": "예약하기,문의하기,관리자와 채팅하기"
    },
    {
        "previous_message": "안녕",
        "return_message": "먼저, 원하는 코스를 선택해주세요.",
        "output_menu": SHOP_MENU_LIST
    },
    {
        "previous_message": "코스",
        "return_message": "이제 날짜와 시간을 선택해주세요.",
        "output_menu": "날짜위젯,확인"
    },
    {
        "previous_message": "완료", #날짜, 시간 선택 후 확인버튼 누름
        "return_message": TIME_CONFIRM,
        "output_menu": "예,아니오"
        #"output_menu": "YES,NO"

    },
    {
        "previous_message": "확인",
        "return_message": "이름을 입력해주세요",
        "output_menu": ""
    },
    {
        "previous_message": "이름",
        "return_message": "전화번호를 입력해주세요",
        "output_menu": ""
    },
            {
        "previous_message": "전화",
        "return_message": "이메일을 입력해주세요",
        "output_menu": ""
    },
    {
        "previous_message": "메일",
        "return_message": PERSONAL_CONFIRM,
        #"output_menu": "YES,NO"
        "output_menu": "예,아니오"

    },
    {
        "previous_message": "정보",
        "return_message": '''네! 당신의 예약이 완료되었습니다. \n예약 해주셔서 감사합니다.\n 예약 번호는 이메일로 전송될 예정입니다.\n
        가지고 계신 메이크업 제품들을 가져와 주시길 부탁드립니다. 또한, 정확한 진단을 위해 맨 얼굴로 방문해주시길 부탁드립니다. \n\n매장 위치는 다음과 같습니다.
        서울 강남구 테헤란로 6길 7 4층\n\n 질문 있으신가요? ''',
        #"output_menu": "YES,NO"
        "output_menu": "예,아니오"
    },
    {   #질문있냐고 물어봤을 때 질문 없다고 할 경우(NO)
        "previous_message": "질문",
        "return_message": "예약해주셔서 감사합니다. 예약 당일에 뵙겠습니다!",
        "output_menu": ""
    },
    {
        "previous_message": "문의",
        "return_message": "무엇이든 물어보세요",
        "output_menu": ""
    },
]
def dict_to_string(d):
    return '\n'.join([f"{key}: {value}\n" for key, value in d.items()])

def making_response_without_rule(my_id,  my_ai_pre_message):
    print('making_response_without_rule==================================>')
    result = {
        'first_flag': 'n',
        'my_id': my_id,  # 0 이면 신규 코스 생성 , 
        'status': 'success',
        'return_message': '',
        'return_menu': ''
    }
    return result

def get_rule(previous_message):
    # First pass: look for a direct match.
    print("get_rule--------------------------->")
    for rule in RULES:
        if rule["previous_message"] == previous_message :
            print("get_rule에서의 최종 rule: ")
            print(rule)
            return rule
    # Second pass: if previous_message is not found and it's a string, check if it's part of any list in previous_message.
    if isinstance(previous_message, str):  # Ensure it's a string to avoid errors with non-iterable types.
        for rule in RULES:
            if isinstance(rule["previous_message"], list) and previous_message in rule["previous_message"]:
                return rule
    
    return None  # Return None if no rule is found

def contains_word(message, word):
    # Test if the word is in the message
    return word in message

@app.route('/server_login/', methods=['GET'])
def server_login():
    print("server_login!")
    try:
        email = request.args.get('email')
        password = request.args.get('password')
        print(email)
        _db = CDB(crm_config)   # 데이터베이스 연결 가정
        select_query = """
            SELECT * FROM t_customers WHERE email = %s AND password = %s;
        """

        # 쿼리 실행
        cursor = _db.execute(select_query, (email, password))
        row = cursor.fetchone()
   #     cursor.close()

        if row:  # 해당 이메일과 패스워드에 해당하는 데이터가 존재하는 경우
            return jsonify({'status': 'success'}), 200  # HTTP 200 상태 코드와 성공 메시지 반환
        else:  # 해당 이메일과 패스워드에 해당하는 데이터가 없는 경우
            select_query = """
                SELECT * FROM managerlogin WHERE email = %s AND password = %s;
            """

            cursor = _db.execute(select_query, (email, password))
            print(email)
            print(password)
            row = cursor.fetchone()
            cursor.close()

            if row:
                print("Entered")  # 해당 이메일과 패스워드에 해당하는 데이터가 존재하는 경우
                return jsonify({'status': 'success_manager'}), 200
            else:
                return jsonify({'status': 'failure'}), 401  # HTTP 401 상태 코드와 실패 메시지 반환
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'status': 'error'}), 500  # HTTP 500 상태 코드와 에러 메시지 반환

@app.route('/server_sign_up/', methods=['GET'])
def server_sign_up():
    print("server_sign up!")
    try:
        email = request.args.get('email')
        user_name = request.args.get('user_name')
        password = request.args.get('password')
        print(email)
        print(user_name)
        print(password)
        _db = CDB(crm_config)   # 데이터베이스 연결 가정
        insert_query = """
            INSERT INTO t_customers (email, user_name, password)
            VALUES (%s, %s, %s);
        """

        _db.execute(insert_query, (email, user_name, password))
 
        _db.commit()  # 변경 사항을 DB에 커밋

        return jsonify({'status': 'success'}), 200  # HTTP 200 상태 코드와 성공 메시지 반환
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'status': 'error'}), 500  # HTTP 500 상태 코드와 에러 메시지 반환

@app.route('/send_verification_code/', methods=['GET'])
def send_verification_code():
    try:
        email = request.args.get('email')
        #     verification_code = generate_verification_code()
        print(request.args.get('verificationCode'))
        verification_code = request.args.get('verificationCode')  # 인증 코드 생성
        print(email)
        print(verification_code)
        send_email(email, verification_code)

        return jsonify({'status': 'success'}), 200  # 성공 메시지 반환
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'status': 'error'}), 500  # 에러 메시지 반환

def generate_verification_code():
    return str(random.randint(100000,999999))

def send_email(to, code):
    print("Hello")
    msg = Message('[Spacechat] Your Verification Code', sender='spacechat1234@gmail.com', recipients=[to])
    msg.body = 'Welcome to Spacechat.\nYour verification code is : {}'.format(code)
    mail.send(msg)

def make_first_response( my_id, user_email) :
    print('첫번째 연결')
    print(user_email)
    res = select_customer(user_email) #customer 정보를 tuple 형태로 가져온다.
    if len(res) <= 0 : #비회원으로 접속 시
        params = (my_id , '', '' ,'', None, None, None, '')
    else : 
        res = res[0]
        print(res)
        user_name = res['user_name']
        user_phone = ''
        email = res['email']
        params = (my_id , user_phone, user_name ,'', None, None, None, '')
    
    result_list = insert_temp_reservation(*params)
    if result_list:
        first_result = result_list[0]  # Accessing the first result if available
        temp_reservation_id = first_result['id']  # Accessing the 'id' from
        return temp_reservation_id
    else :
        return temp_reservation_id

#DB에 개인정보 기록하는 함수
def insert_personal_info(my_id, input_msg, my_ai_pre_message,selectedDate,selectedTime):    
    result = (my_id, '', '', '', None, None, None, None)
    print("insert_personal_info---------------------------->")
    if contains_word(my_ai_pre_message, '이름'):
        params = (my_id, '', input_msg, '', None, None, None, None)
        #params = (my_id, input_msg, '', '', None, None, None,None)
        result = insert_temp_reservation(*params)
    elif contains_word(my_ai_pre_message, '전화'):
        params = (my_id, input_msg, '', '', None, None, None,None)
        #params = (my_id, '', input_msg, '', None, None, None, None)
        result = insert_temp_reservation(*params)
    elif contains_word(my_ai_pre_message, '이메일'):
        if input_msg not in ["YES", "NO","아니요","예","아니오"]:
            params = (my_id, '', '', '', None, None, input_msg, None)
            result = insert_temp_reservation(*params)
            final_email = input_msg  #이 이메일로 예약 번호(my_id) 보내줘야함
            #print(f"final_email)
            print(f"????????????????? {final_email}")
    elif contains_word(my_ai_pre_message, '코스'):
        params = (my_id, '', '', input_msg, None, None, None, None)
        result = insert_temp_reservation(*params)
    elif contains_word(my_ai_pre_message, '날짜'):
        # 시간을 시:분 형식으로 변환하여 입력
        hour_minute = selectedTime.split(':')[:2]  # 시간과 분만 선택
        formatted_time = ':'.join(hour_minute)  # 시간과 분을 다시 ':'로 연결하여 형식 맞춤
        params = (my_id, '', '', '', selectedDate, formatted_time, None, None)
        result = insert_temp_reservation(*params) 

    return result

def making_response_with_rule(my_id, rule, my_ai_pre_message):  
    print('making_response_with_rule==================================>')

    result = {
        'first_flag': 'n',
        'my_id': my_id,
        'status': 'success',
        'return_message': '',
        'return_menu': ''
    }
    res = select_reservation(my_id)
    res = res[0]
    lang = res['lang']
    if rule["return_message"] == TIME_CONFIRM:
           # 원래의 reserv_time을 시간 형식으로 변환
        original_time = res['reserv_time']
        time_obj = datetime.datetime.strptime(original_time, "%H:%M:%S")
        formatted_time = time_obj.strftime("%H:%M")
        return_message  = res['menu']+', '+str(res['reserv_date'])+', ' + formatted_time + " \n내용을 확인해주세요. 맞을까요?"
    elif rule["return_message"] == PERSONAL_CONFIRM:
        return_message = '한번 더 체크하겠습니다.\n'+str(res['reserv_date']) +', ' + str(res['reserv_time'])+', '+res['menu']+'\n'+'Name: '+ res['name'] +'\n'+'Phone No: '+res['tel'] +'\n'+'Email: '+res['email'] +"\n해당 정보가 맞을까요?"
    else:
        return_message = rule["return_message"]   
    params = (my_id , '', '' ,'', None, None, None, return_message) 
    result_list = insert_temp_reservation(*params)
    
    output_menu_str = ', '.join(rule["output_menu"]) if isinstance(rule["output_menu"], list) else rule["output_menu"]

    if lang == TAG_ENG :
        result["return_message"] =  translate_with_deepl(return_message, target_lang="EN")
        result['return_menu'] = translate_with_deepl(output_menu_str, target_lang="EN")
    else :
        result["return_message"] = return_message
        result['return_menu'] = output_menu_str

    return result

def extract_keyword(input_text):
    # 입력 텍스트를 공백을 기준으로 분할하여 단어 목록 생성
    words = input_text.split()
    for word in words:
        # 키워드 목록을 반복하면서 해당 키워드를 찾음
        for keyword in KEYWORDS:
            if keyword in word:
                return keyword 
    # 모든 키워드를 찾지 못하면 None 반환
    return None

def update_lang(id, lang):
    print("update_lang-------------------------------------->!")
    try:
        _db = CDB(crm_config)   # 데이터베이스 연결 가정
        update_query = """
            UPDATE t_reservations SET lang = %s WHERE id = %s ;
        """

        # 쿼리 실행
        cursor = _db.execute(update_query, (lang, id))
        _db.commit()
        cursor.close()

        return {"status": "success"}  # 성공적으로 업데이트 되었음을 나타내는 결과 반환

    except Exception as e:
        _db.rollback()
        print(f'-----------------------------------\n{traceback.format_exc()}')
        return {"status": "error", "message": str(e)}


def preprocess_sentence(sentence):
    sentence = re.sub(r"([?.!,])", r" \1 ", sentence)
    sentence = sentence.strip()
    return sentence


def evaluate(sentence):
    print("IN EVALUATE")
    sentence = preprocess_sentence(sentence)
    #print("이게 customer message???"+sentence)
    print(f"이게 customer message??? {sentence}")
    print("IN EVALUATE2")
    print(tokenizer.encode(sentence))
    # 입력 문장을 정수 시퀀스로 변환
#    input_sequence = tokenizer.encode(sentence)

    sentence = tf.expand_dims(
        START_TOKEN + tokenizer.encode(sentence) + END_TOKEN, axis=0)
 #   print("IN EVALUATE3")
    output = tf.expand_dims(START_TOKEN, 0)

    for _ in range(MAX_LENGTH):
        predictions = model(inputs=[sentence, output], training=False)
        predictions = predictions[:, -1:, :]
        predicted_id = tf.cast(tf.argmax(predictions, axis=-1), tf.int32)
#        print("IN EVALUATE4")
        if tf.equal(predicted_id, END_TOKEN[0]):
            break

        output = tf.concat([output, predicted_id], axis=-1)
#    print("IN EVALUATE5")
    return tf.squeeze(output, axis=0)

def send_res_email(to, reservation_info):
    msg = Message('[Spacechat] Confirmed Reservation', sender='spacechat1234@gmail.com', recipients=[to])
    msg.body = f'Thank you for making a reservation.\nYour reservation details are as follows :\n{reservation_info}'
    mail.send(msg)
    print("Sent email")
    print(to)


app.inquiry = 0
app.res = 0
app.my_id2 = 0

@app.route('/send_message/', methods=['GET'])
def send_message():
    input_msg = request.args.get('message')
    
    if input_msg and '입장했습니다' in input_msg:
        app.inquiry = 0
        app.res = 0
        app.my_id2 = 0

    print('send_message----------------------->')
    selectedDate = None
    selectedTime = None
    try:
    #input_msg = request.args.get('message')
        if (app.inquiry == 1):
            print("IN PREDICTION")
            prediction = evaluate(input_msg)
            print(f"Prediction : {prediction}")
            print("IN PREDICTION2")
            predicted_sentence = tokenizer.decode(
                [i for i in prediction if i < tokenizer.vocab_size])
            print("PREDICTED SENTENCE : " + predicted_sentence)
            print("app.res : " + str(app.res))
            print("my_id2 : " + str(app.my_id2))
            if (predicted_sentence == '예약 확인') :
                if (app.res == 0) :
                    predicted_sentence = '예약 현황이 없습니다. 먼저 예약을 진행해주세요.'
                elif (app.res == 1) :
                    print("Here")
                    print("my_id2 : "+ str(app.my_id2))
                    if app.my_id2:
                        print(f"Fetching reservation for my_id: {app.my_id2}")
                        res = select_reservation(app.my_id2)
                        print(f"Reservation fetched: {res}")
                        if res:
                            res = res[0]
                            lang = res['lang']
                            predicted_sentence = (
                                '예약 현황은 다음과 같습니다.\n'
                                        f"Date and time : {res['reserv_date']}, {res['reserv_time']}\n"
                                        f"Session : {res['menu']}\n"
                                        f"Name: {res['name']}\n"
                                        f"Phone No: {res['tel']}\n"
                            )
                        else:
                            predicted_sentence = "예약 정보를 찾을 수 없습니다."
                    else:
                        print("my_id2 is None or empty")
            
            print("PREDICTED SENTENCE2 : " + predicted_sentence)
            app.inquiry = 1
            return jsonify({'prediction': predicted_sentence})

        my_ai_pre_message = request.args.get('my_ai_pre_message')
        user_email = request.args.get('email')
        my_id_str = request.args.get('my_id')
        selectedDateTime = request.args.get('selectedDateTime')  # Receive selectedDateTime parameter

        my_id = int(my_id_str)
        print('my_id = '+str(my_id)+' user_email = '+user_email+' input_msg='+input_msg +' my_ai_pre_message='+my_ai_pre_message)
        
        if my_id == 0:
            my_id =  make_first_response( my_id, user_email )
            app.my_id2 = my_id
            update_lang(my_id, TAG_KOR)
            rule = RULES[0]
            respon =  making_response_with_rule( my_id , rule , '')
            return jsonify(respon)

        # 전 대화를 보고 입력할게 있으면 입력한다.
        res = select_reservation(my_id)
        res = res[0]
        my_ai_pre_message = res['pre_message']
        rule = None        
        print('my_ai_pre_message = '+ my_ai_pre_message) #안녕
        extracted_keyword = extract_keyword(my_ai_pre_message)
        if extracted_keyword:
            print('extracted_keyword = '+ extracted_keyword)  
            print('input_msg = '+input_msg)
            #print('user_email '+ user_email)
            if extracted_keyword == '확인' and (input_msg == "아니요" or input_msg == "아니오" or input_msg == "NO" or input_msg =="하지 않았습니다."):
                extracted_keyword = "안녕"

            #elif user_email == 'null' and extracted_keyword == '확인' and (input_msg == "네" or input_msg == "YES"):
            #    extracted_keyword = "확인" #회원가입했으면 이름 안받고 전화번호 부터 받음.
            #elif user_email == 'null' and extracted_keyword == '이름':
            #    extracted_keyword = "전화" #회원가입했으면 이름 안받고 전화번호 부터 받음.

            #elif user_email != 'null' and extracted_keyword == '확인' and (input_msg == "네" or input_msg == "YES"):
            #    extracted_keyword = "이름" #회원가입했으면 이름 안받고 전화번호 부터 받음.
            #elif user_email != 'null' and extracted_keyword == '전화' :
            #    extracted_keyword = "메일"

            elif extracted_keyword == '정보' and (input_msg == "아니오" or input_msg == "아니요" or input_msg == "NO" or input_msg =="하지 않았습니다.") :
                extracted_keyword = "확인"

            elif extracted_keyword == '완료' and (input_msg == "아니오" or input_msg == "아니요" or input_msg == "NO" or input_msg =="하지 않았습니다.") :
                extracted_keyword = "질문"

            elif extracted_keyword == '정보' and (input_msg == "예" or input_msg == "YES"  or input_msg == "例" or input_msg =="是") :
                email = res['email']
                reservation_info = (
                    f"\nReservation Number : {res['id']}\n"
                    f"Date and time : {res['reserv_date']}, {res['reserv_time']}\n"
                    f"Session : {res['menu']}\n"
                    f"Name: {res['name']}\n"
                    f"Phone No: {res['tel']}\n"
                )
                send_res_email(email, reservation_info)

            elif extracted_keyword == '완료' and (input_msg == "예" or input_msg == "YES" or input_msg == "例" or input_msg =="是") :
                extracted_keyword = "문의"
                app.inquiry = 1
                app.res = 1

            elif extracted_keyword == '안녕' and (input_msg == "Chat with Manager" or input_msg =="관리자와 채팅하기") :
                extracted_keyword = "Manager"
                response = {
                    "status": "success",
                    "message": "chat_with_manager"
                }
                return jsonify(response)

            elif extracted_keyword == '안녕' and (input_msg == "Ask a Question" or input_msg =="문의하기" or input_msg =="질문하기") :
                extracted_keyword = "문의"
                app.inquiry = 1

            elif extracted_keyword == '날짜' and (input_msg == "OK" or input_msg == "확인") :
                extracted_keyword = "완료"

            rule = get_rule(extracted_keyword)

            if extracted_keyword == '완료' :
                rule == get_rule(extracted_keyword)
                # Check if selectedDateTime is received
                if selectedDateTime:
                    # Handle the received selectedDateTime parameter
                    selectedDate, selectedTime = selectedDateTime.split(' ')


                    
        insert_res =  insert_personal_info(my_id, input_msg, my_ai_pre_message,selectedDate,selectedTime)

        if rule:
            respon =  making_response_with_rule(my_id, rule, my_ai_pre_message)
        else:
            respon =  making_response_without_rule(my_id, my_ai_pre_message)
        
        # 전 대화를 보고 rule 에 있는지 찾아보고 있으면 바로 다음 대화를 유도 한다.
        return jsonify({**respon, 'return_menu': respon.get('return_menu', '')})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e), 'first_flag': 'n'})

# MySQL 연결 설정
db_config = {
    'user': 'your_username',
    'password': 'your_password',
    'database': 'your_database_name',
    'host': 'your_host',
}

@app.route('/mypage/', methods=['GET'])
def mypage():
    try:
        email = request.args.get('email')  # 클라이언트로부터 이메일 받기
        print("Logged in email:", email)  # 디버깅을 위한 로그 메시지

        if not email:
            return jsonify({"error": "No email provided"}), 400

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }
        connection = pymysql.connect(**db_config)

        # 고객 정보 가져오기
        customer_query = "SELECT user_name, image FROM t_customers WHERE email = %s"
        with connection.cursor() as cursor:
            cursor.execute(customer_query, (email,))
            customer_data = cursor.fetchone()

        if not customer_data:
            return jsonify({"error": "Customer not found"}), 404

        username, image = customer_data

        # 고객 정보 반환
        result = {
            "username": username,
            "image": image.decode('utf-8') if image else None
        }
        connection.close()
        return jsonify(result)

    except Exception as e:
        print('An error occurred while processing the request:', e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/change_username/', methods=['POST'])
def change_username():
    try:
        # 클라이언트로부터 전달된 데이터 가져오기
        data = request.get_json()
        email = data['email']
        new_username = data['username']

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }

        connection = pymysql.connect(**db_config)

        # 데이터베이스 업데이트
        with connection.cursor() as cursor:
            update_query = "UPDATE t_customers SET user_name = %s WHERE email = %s"
            cursor.execute(update_query, (new_username, email))
            connection.commit()

        return jsonify({"success": True, "message": "Username changed successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        if 'connection' in locals():
            connection.close()

@app.route('/delete_account/', methods=['POST'])
def delete_account():
    try:
        # 클라이언트로부터 전달된 데이터 가져오기
        data = request.get_json()
        email = data['email']

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }

        connection = pymysql.connect(**db_config)

        # 데이터베이스에서 계정 삭제
        with connection.cursor() as cursor:
            delete_query = "DELETE FROM t_customers WHERE email = %s"
            cursor.execute(delete_query, (email,))
            connection.commit()

        return jsonify({"success": True, "message": "Account deleted successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        if 'connection' in locals():
            connection.close()

# 현재 비밀번호 확인 엔드포인트
@app.route('/check_current_password/', methods=['POST'])
def check_current_password():
    try:
        data = request.get_json()
        email = data['email']
        current_password = data['password']
        print("email : " + email)
        print("Current Password : " + current_password)

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }

        connection = pymysql.connect(**db_config)
        with connection.cursor() as cursor:
            select_query = "SELECT password FROM t_customers WHERE email = %s"
            cursor.execute(select_query, (email,))
            result = cursor.fetchone()
            print("Password from database:", result[0])  # 쿼리 결과 출력

            if result:
                print("HERE")
                password_match = current_password == result[0]
                return jsonify({"passwordMatch": password_match}), 200
            else:
                return jsonify({"passwordMatch": False}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        if 'connection' in locals():
            connection.close()

# 비밀번호 변경 엔드포인트
@app.route('/change_password/', methods=['POST'])
def change_password():
    try:
        data = request.get_json()
        email = data['email']
        new_password = data['password']

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }
        
        connection = pymysql.connect(**db_config)
        with connection.cursor() as cursor:
            update_query = "UPDATE t_customers SET password = %s WHERE email = %s"
            cursor.execute(update_query, (new_password, email))
            connection.commit()

        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        if 'connection' in locals():
            connection.close()

def timedelta_to_str(td):
    hours = td.seconds // 3600
    minutes = (td.seconds // 60) % 60
    return "{:02}:{:02}".format(hours, minutes)

@app.route('/fetch_reservations/', methods=['POST'])
def fetch_reservations():
    try:
        # 클라이언트로부터 전달된 데이터 가져오기
        data = request.get_json()
        print("Received data:", data)  # 받은 데이터 확인
        email = data['email']

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }

        # 데이터베이스 연결
        connection = pymysql.connect(**db_config)

        with connection.cursor() as cursor:
            # 이메일에 해당하는 예약 정보 가져오기
            select_query = "SELECT id, menu, reserv_date, reserv_time FROM t_reservations WHERE email = %s"
            cursor.execute(select_query, (email,))
            reservations = cursor.fetchall()

        print("Fetched reservations:", reservations)  # 가져온 예약 정보 출력

        # 리스트로 변환하여 timedelta 객체를 문자열로 변환하여 추가
        prepared_reservations = []
        for reservation in reservations:
            prepared_reservation = list(reservation)
            prepared_reservation[3] = timedelta_to_str(reservation[3])
            prepared_reservations.append(prepared_reservation)

        print("Prepared reservations:", prepared_reservations)  # 처리된 예약 정보 확인

        return jsonify({"reservations": prepared_reservations}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        if 'connection' in locals():
            connection.close()

@app.route('/update_profile_image', methods=['POST'])
def update_profile_image():
    try:
        # 클라이언트가 업로드한 파일 가져오기
        profile_image = request.files['profileImage']
        print(profile_image)
     #   print("HERE")
        # 이메일 가져오기 (클라이언트로부터 전송되어야 함)
        email = request.form['email']  # 클라이언트로부터 이메일을 받아야 함
        print(email)
        # 데이터베이스 연결 설정

        image_bytes = profile_image.read()
      #  print(f"Image bytes length: {len(image_bytes)}")

        # 이미지를 base64 인코딩
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
       # print(f"Image base64 length: {len(image_base64)}")

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }

        connection = pymysql.connect(**db_config)
        with connection.cursor() as cursor:
            update_query = "UPDATE t_customers SET image = %s WHERE email = %s"
            cursor.execute(update_query, (image_base64, email))
            connection.commit()

        return jsonify({'message': 'Profile image updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        if 'connection' in locals():
            connection.close()

@app.route('/get_profile_image', methods=['GET'])
def get_profile_image():
    try:
        email = request.args.get('email')  # 클라이언트로부터 이메일 받기
        print("Requested email:", email)  # 디버깅을 위한 로그 메시지

        if not email:
            return jsonify({"error": "No email provided"}), 400

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }
        connection = pymysql.connect(**db_config)

        # 프로필 이미지 가져오기
        profile_image_query = "SELECT image FROM t_customers WHERE email = %s"
        with connection.cursor() as cursor:
            cursor.execute(profile_image_query, (email,))
            image_data = cursor.fetchone()

        if not image_data:
            return jsonify({"error": "Profile image not found for the provided email"}), 404

        image_base64 = image_data[0].decode('utf-8') if image_data[0] else None

        # 이미지 데이터 반환
        result = {
            "image": image_base64
        }
        connection.close()
        return jsonify(result)

    except Exception as e:
        print('An error occurred while processing the request:', e)
        return jsonify({"error": "Internal Server Error"}), 500

def get_db_connection():
    db_config = {
    'user': app.config['MYSQL_DATABASE_USER'],
    'password': app.config['MYSQL_DATABASE_PASSWORD'],
    'database': app.config['MYSQL_DATABASE_DB'],
    'host': app.config['MYSQL_DATABASE_HOST'],
    }
    return pymysql.connect(**db_config)

customer_rooms = {'guest': None}
manager_socket_id = None
guest_id = 'guest'

def initialize_rooms():
    print("Initializing rooms from database...")
    db_config = {
    'user': app.config['MYSQL_DATABASE_USER'],
    'password': app.config['MYSQL_DATABASE_PASSWORD'],
    'database': app.config['MYSQL_DATABASE_DB'],
    'host': app.config['MYSQL_DATABASE_HOST'],
    }
    connection = pymysql.connect(**db_config)

    try:
        with connection.cursor() as cursor:
            query = "SELECT DISTINCT room_id FROM chat_messages"
            cursor.execute(query)
            rooms = cursor.fetchall()
            for room in rooms:
                room_id = room[0]
                customer_rooms[room_id] = None
                print(f"Initialized room: {room_id}")
    finally:
        connection.close()

@app.route('/rooms')
def rooms():
    return jsonify({"rooms": list(customer_rooms.keys())})

@socketio.on('connect')
def handle_connect():
    global manager_socket_id
    role = request.args.get('role')
    if role == 'manager':
        manager_socket_id = request.sid
        print(f"Manager connected with socket ID: {request.sid}")
        emit('rooms_list', {"rooms": list(customer_rooms.keys())}, room=manager_socket_id)
    else:
        print(f"Customer connected with socket ID: {request.sid}")
        handle_room_id(guest_id)

@socketio.on('disconnect')
def handle_disconnect():
    global manager_socket_id
    if request.sid == manager_socket_id:
        print(f"Manager disconnected with socket ID: {request.sid}")
        manager_socket_id = None

@socketio.on('room_id')
def handle_room_id(room_id):
    global customer_rooms
    print("Received room ID:", room_id)
    customer_rooms[room_id] = request.sid  # 고객의 방 ID와 소켓 ID를 매핑
  #  if manager_socket_id:
    #    socketio.emit('new_room_id', room_id, room=manager_socket_id)

@socketio.on('join')
def handle_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    print(f"{username} has joined the room {room}")

    # 고객이 이미 참여한 방인지 확인
    if room in customer_rooms:
        print(f"Room {room} already exists")
        # 고객이 이미 참여한 방이면 방을 재연결함을 매니저에게 알림
    
    #    emit('rejoin', room, room=manager_socket_id)
    else:
        print(f"Room {room} doesn't exist")
        # 고객이 처음 참여한 방이면 방을 추가하여 매니저에게 알림
        customer_rooms[room] = request.sid
    #    emit('new_room_id', room, room=manager_socket_id)

@socketio.on('leave')
def handle_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    print(f"{username} has left the room {room}")

@socketio.on('message')
def handle_message(data):
    message = data['message']
    room = data['room']
    sender = data['sender']


    send({'message': message, 'sender': sender}, room=room)

@socketio.on('delete_room')
def handle_delete_room(data):
    room_id = data['room_id']
    if room_id in customer_rooms:
        leave_room(room_id)
        del customer_rooms[room_id]
        emit('room_deleted', room_id, broadcast=True)
        print(f"Room {room_id} deleted")

@app.route('/get_room_id', methods=['POST'])
def get_room_id():
    data = request.json
    email = data['email']
    room_id = None

    db_config = {
        'user': app.config['MYSQL_DATABASE_USER'],
        'password': app.config['MYSQL_DATABASE_PASSWORD'],
        'database': app.config['MYSQL_DATABASE_DB'],
        'host': app.config['MYSQL_DATABASE_HOST'],
    }
    connection = pymysql.connect(**db_config)
    try:
        with connection.cursor() as cursor:
            query = "SELECT room_id FROM chat_messages WHERE sender = %s LIMIT 1"
            cursor.execute(query, (email,))
            result = cursor.fetchone()
            if result:
                room_id = result[0]
    finally:
        connection.close()

    if room_id:
        return jsonify({'room_id': room_id})
    else:
        return jsonify({'message': 'Room ID not found'}), 404

@app.route('/get_email', methods=['POST'])
def get_email():
    try:
        data = request.json
        room_id = data['room_id']  # 'room_id'로 변경하여 일관성을 유지

        # 데이터베이스 연결 설정
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }

        # 데이터베이스 연결
        connection = pymysql.connect(**db_config)
        email = None

        with connection.cursor() as cursor:
            # room_id에 해당하는 email 가져오기
            select_query = "SELECT sender FROM chat_messages WHERE room_id = %s LIMIT 1"
            cursor.execute(select_query, (room_id,))
            result = cursor.fetchone()
            if result:
                email = result[0]

        # 이메일을 JSON 형태로 반환
        if email:
            return jsonify({"email": email}), 200
        else:
            return jsonify({"error": "Email not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        if 'connection' in locals():
            connection.close()



@app.route('/get_messages', methods=['POST'])
def get_messages():
    data = request.json
    room_id = data['room_id']

     # 데이터베이스에 메시지 저장
    db_config = {
        'user': app.config['MYSQL_DATABASE_USER'],
        'password': app.config['MYSQL_DATABASE_PASSWORD'],
        'database': app.config['MYSQL_DATABASE_DB'],
        'host': app.config['MYSQL_DATABASE_HOST'],
    }
    connection = pymysql.connect(**db_config)
    try:
        with connection.cursor() as cursor:
            query = "SELECT sender, message FROM chat_messages WHERE room_id = %s ORDER BY timestamp"
            cursor.execute(query, (room_id,))
            messages = cursor.fetchall()

            formatted_messages = []
            for sender, message in messages:
                formatted_messages.append({'sender': sender, 'message': message})
    finally:
        connection.close()
    return jsonify(formatted_messages)

@app.route('/save_message', methods=['POST'])
def save_message():
    try:
        data = request.json
        room = data.get('room')
        message = data.get('message')
        sender = data.get('sender')
        print("HERE2")
        if not (room and message and sender):
            return jsonify({"error": "Missing required fields"}), 400

        # 데이터베이스에 메시지 저장
        db_config = {
            'user': app.config['MYSQL_DATABASE_USER'],
            'password': app.config['MYSQL_DATABASE_PASSWORD'],
            'database': app.config['MYSQL_DATABASE_DB'],
            'host': app.config['MYSQL_DATABASE_HOST'],
        }
        connection = pymysql.connect(**db_config)

        insert_query = "INSERT INTO chat_messages (room_id, message, sender) VALUES (%s, %s, %s)"
        with connection.cursor() as cursor:
            cursor.execute(insert_query, (room, message, sender))
            connection.commit()

        connection.close()

        return jsonify({"success": True}), 200

    except Exception as e:
        print('An error occurred while processing the request:', e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/get_reservations', methods=['GET'])
def get_reservations():
    db_config = {
        'user': app.config['MYSQL_DATABASE_USER'],
        'password': app.config['MYSQL_DATABASE_PASSWORD'],
        'database': app.config['MYSQL_DATABASE_DB'],
        'host': app.config['MYSQL_DATABASE_HOST'],
    }
    connection = pymysql.connect(**db_config)
    try:
        with connection.cursor() as cursor:
            query = """
                SELECT id, tel, name, email, menu, reserv_date, reserv_time
                FROM t_reservations
                WHERE tel IS NOT NULL AND name IS NOT NULL AND email IS NOT NULL AND menu IS NOT NULL
                AND reserv_date IS NOT NULL AND reserv_time IS NOT NULL
                ORDER BY id
            """
            cursor.execute(query)
            reservations = cursor.fetchall()
            formatted_reservations = []
            for reservation in reservations:
                id, tel, name, email, menu, reserv_date, reserv_time = reservation
                formatted_reservations.append({
                    'id': id,
                    'tel': tel,
                    'name': name,
                    'email': email,
                    'menu': menu,
                    'reserv_date': reserv_date.strftime('%Y-%m-%d'),
                    'reserv_time': timedelta_to_str(reserv_time)
                })
    finally:
        connection.close()
    return jsonify(formatted_reservations)



if __name__ == '__main__':
    initialize_rooms()
    socketio.run(app, host='0.0.0.0', port=60000)


