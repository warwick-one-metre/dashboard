#
# onemetre-dashboard is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# onemetre-dashboard is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with onemetre-dashboard.  If not, see <http://www.gnu.org/licenses/>.

# pylint: disable=invalid-name

import datetime
import json
import pymysql

from flask import abort
from flask import Flask
from flask import jsonify
from flask import redirect
from flask import render_template
from flask import request
from flask import send_from_directory
from flask import session
from flask import url_for
from flask_oauthlib.client import OAuth

from dashboard import weather_json

# Log and weather data are stored in the database
DATABASE_DB = 'ops'
DATABASE_USER = 'ops'

ONEMETRE_GENERATED_DATA = {
    'blue': 'dashboard-BLUE.json',
    'blue/image': 'dashboard-BLUE-thumb.png',
    'red': 'dashboard-RED.json',
    'red/image': 'dashboard-RED-thumb.png',
}

app = Flask(__name__)

# Read secret data from the database
db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER)
with db.cursor() as cur:
    query = 'SELECT keyname, value from dashboard_config WHERE 1'
    cur.execute(query)
    for x in cur:
        app.config[x[0]] = x[1]

# Use github's OAuth interface for verifying user identity
oauth = OAuth(app)
github = oauth.remote_app(
    'github',
    consumer_key=app.config['GITHUB_KEY'],
    consumer_secret=app.config['GITHUB_SECRET'],
    request_token_params={'scope': 'read:org'},
    base_url='https://api.github.com/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize'
)

def get_user_account():
    username = None
    avatar = None
    permissions = []
    errors = []

    # Check for OAuth login response
    if 'code' in request.args:
        resp = github.authorized_response()
        if resp is not None and 'access_token' in resp:
            session['github_token'] = (resp['access_token'], '')

    if 'error' in request.args and 'error_description' in request.args:
        errors.append('Unable to authenticate with Github')

    if 'username' in session and 'avatar' in session and 'permissions' in session:
        username = session['username']
        avatar = session['avatar']
        permissions = session['permissions']
    elif 'github_token' in session:
        try:
            user = github.get('user')
            username = session['username'] = user.data['login']
            avatar = session['avatar'] = user.data['avatar_url']
            if github.get('teams/2128810/memberships/' + username).data['state'] == 'active':
                permissions.append('onemetre')
                # todo: check a different group
                permissions.append('nites')
            session['permissions'] = permissions
        except:
            errors.append('Unable to query Github user data')

    return {
        'username': username,
        'avatar': avatar,
        'permissions': permissions
    }, errors

@github.tokengetter
def get_github_oauth_token():
    return session.get('github_token')

@app.route('/login')
def login():
    callback = request.args['next'] if 'next' in request.args else url_for('onemetre_dashboard', _external=True)
    return github.authorize(callback=callback)

@app.route('/logout')
def logout():
    next = request.args['next'] if 'next' in request.args else url_for('onemetre_dashboard')
    session.pop('github_token', None)
    session.pop('username', None)
    session.pop('avatar', None)
    session.pop('permissions', None)
    return redirect(next)

# Main pages
@app.route('/onemetre/')
def onemetre_dashboard():
    account, errors = get_user_account()
    return render_template('onemetre/dashboard.html', user_account=account, errors=errors)

@app.route('/onemetre/current/')
def onemetre_current():
    account, errors = get_user_account()
    return render_template('onemetre/current.html', user_account=account, errors=errors)

@app.route('/onemetre/dome/')
def onemetre_dome():
    account, errors = get_user_account()
    return render_template('onemetre/dome.html', user_account=account, errors=errors)

@app.route('/nites/dome/')
def nites_dome():
    account, errors = get_user_account()
    return render_template('nites/dome.html', user_account=account, errors=errors)

@app.route('/weather/')
def weather():
    account, errors = get_user_account()
    return render_template('weather.html', user_account=account, errors=errors)

@app.route('/extcams/')
def extcams():
    account, errors = get_user_account()
    return render_template('extcams.html', user_account=account, errors=errors)

@app.route('/skycams/')
def skycams():
    account, errors = get_user_account()
    return render_template('skycams.html', user_account=account, errors=errors)

@app.route('/resources/')
def resources():
    account, errors = get_user_account()
    return render_template('resources.html', user_account=account, errors=errors)

# Dynamically generated JSON
@app.route('/data/obslog')
def observatory_log():
    account, errors = get_user_account()
    if 'onemetre' in account['permissions']:
        # Returns latest 250 log messages.
        # If 'from' argument is present, returns latest 100 log messages with a greater id
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER)
        with db.cursor() as cur:
            query = 'SELECT id, date, type, source, message from obslog'
            if 'from' in request.args:
                query += ' WHERE id > ' + db.escape(request.args['from'])

            query += ' ORDER BY id DESC LIMIT 250;'
            cur.execute(query)
            messages = [(x[0], x[1].isoformat(), x[2], x[3], x[4]) for x in cur]
            return jsonify(messages=messages)
    abort(404)

@app.route('/data/weather')
def weatherdata():
    date = request.args['date'] if 'date' in request.args else None
    data, start, end = weather_json.plot_json(date)
    return jsonify(data=data, start=start, end=end)

@app.route('/data/onemetre/')
def onemetre_dashboard_data():
    data = json.load(open('/srv/dashboard/generated/onemetre-public.json'))
    account, errors = get_user_account()
    if 'onemetre' in account['permissions']:
        data.update(json.load(open('/srv/dashboard/generated/onemetre-pipeline.json')))

    return jsonify(**data)

@app.route('/data/onemetre/<path:path>')
def onemetre_generated_data(path):
    account, errors = get_user_account()
    if 'onemetre' in account['permissions'] and path in ONEMETRE_GENERATED_DATA:
        return send_from_directory('/srv/dashboard/generated', ONEMETRE_GENERATED_DATA[path])
    abort(404)

