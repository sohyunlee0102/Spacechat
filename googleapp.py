from flask import Flask, redirect, url_for, session, request, render_template
from authlib.integrations.flask_client import OAuth
import os
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import pymysql
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Configure OAuth
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id='',  # Replace with your actual Client ID
    client_secret='',  # Replace with your actual Client Secret
    access_token_params=None,
    authorize_params=None,
    authorize_endpoint='https://accounts.google.com/o/oauth2/auth',
    userinfo_endpoint='https://www.googleapis.com/oauth2/v1/userinfo',
    client_kwargs={
        'scope': 'email https://www.googleapis.com/auth/calendar.events',
        'access_type': 'offline',
        'prompt': 'consent'
    },
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration'
)

SCOPES = ['https://www.googleapis.com/auth/calendar.events']
calendar_service = None

app.config['MYSQL_DATABASE_USER']     = ''
app.config['MYSQL_DATABASE_PASSWORD'] = ''
app.config['MYSQL_DATABASE_DB']       = ''
app.config['MYSQL_DATABASE_HOST']     = ''

# Initialize APScheduler
scheduler = BackgroundScheduler()
scheduler.start()

# Function to sync reservations with Google Calendar
def sync_reservations_with_google_calendar():
    if 'token' not in session:
        return
    
    last_synced_id = session.get('last_synced_id', 0)

    token = session['token']
    credentials = Credentials(token['access_token'],
                              refresh_token=token.get('refresh_token'),
                              token_uri='https://oauth2.googleapis.com/token',
                              client_id='',
                              client_secret='')
    
    service = build('calendar', 'v3', credentials=credentials)

    # Database connection
    db_config = {
        'user': app.config['MYSQL_DATABASE_USER'],
        'password': app.config['MYSQL_DATABASE_PASSWORD'],
        'database': app.config['MYSQL_DATABASE_DB'],
        'host': app.config['MYSQL_DATABASE_HOST'],
    }
    connection = pymysql.connect(**db_config)

    query = f"""
        SELECT id, tel, name, email, menu, reserv_date, reserv_time
        FROM t_reservations
        WHERE tel IS NOT NULL AND name IS NOT NULL AND email IS NOT NULL AND menu IS NOT NULL
        AND reserv_date IS NOT NULL AND reserv_time IS NOT NULL
        AND id > {last_synced_id}
        ORDER BY id
    """
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
            
            for row in results:
                id, tel, name, email, menu, reserv_date, reserv_time = row
                reserv_date_str = reserv_date.strftime('%Y-%m-%d')  # Convert datetime.date to string
                reserv_time_str = f'{reserv_time.seconds // 3600:02}:{(reserv_time.seconds // 60) % 60:02}:00'  # Convert timedelta to HH:MM:SS string
                start_datetime = datetime.strptime(f'{reserv_date_str} {reserv_time_str}', '%Y-%m-%d %H:%M:%S')
                end_datetime = start_datetime + timedelta(hours=1)
                
                event = {
                    'summary': f'{name} 님',
                    'description': f'예약 정보: Session - {menu}, Tel - {tel}, Email - {email}',
                    'start': {
                        'dateTime': start_datetime.isoformat(),
                        'timeZone': 'Asia/Seoul',
                    },
                    'end': {
                        'dateTime': end_datetime.isoformat(),
                        'timeZone': 'Asia/Seoul',
                    },
                }
                event = service.events().insert(calendarId='primary', body=event).execute()
                event_link = event.get("htmlLink")
                print(f'Event created: {event_link}')
                
                # Update last synced ID in session
                session['last_synced_id'] = id

    finally:
        connection.close()

# Schedule job to sync reservations every hour
scheduler.add_job(sync_reservations_with_google_calendar, 'interval', hours=1)

@app.route('/google_login2')
def google_login2():
    redirect_uri = url_for('authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/callback')
def authorize():
    token = google.authorize_access_token()
    resp = google.get('https://www.googleapis.com/oauth2/v1/userinfo')
    user_info = resp.json()
    session['email'] = user_info['email']
    session['token'] = token  # Save token in the session
    session['last_synced_id'] = 0  # Initialize last synced ID
    
    # Redirect to sync_with_google_calendar after login
    return redirect(url_for('sync_with_google_calendar'))

@app.route('/profile')
def profile():
    email = session.get('email')
    event_link = request.args.get('event_link', None)
    if event_link:
        return f'Hello, {email}! Event created: <a href="{event_link}">{event_link}</a>'
    else:
        return f'Hello, {email}!'

@app.route('/logout')
def logout():
    session.pop('email', None)
    session.pop('token', None)  # Remove token from session on logout
    session.pop('last_synced_id', None)  # Remove last synced ID from session
    return redirect('/')

@app.route('/sync_with_google_calendar')
def sync_with_google_calendar():
    sync_reservations_with_google_calendar()
    return render_template('sync_complete.html', message='Google Calendar synchronization completed.')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
