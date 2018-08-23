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

from dashboard import environment_json

# pylint: disable=missing-docstring

# Log and weather data are stored in the database
DATABASE_DB = 'ops'
DATABASE_USER = 'ops'

GENERATED_DATA_DIR = '/srv/dashboard/generated'
ONEMETRE_GENERATED_DATA = {
    'blue': 'dashboard-BLUE.json',
    'blue/image': 'dashboard-BLUE-thumb.png',
    'red': 'dashboard-RED.json',
    'red/image': 'dashboard-RED-thumb.png',
}

RASA_GENERATED_DATA = {
    'rasa': 'dashboard-RASA.json',
    'rasa/thumb': 'dashboard-RASA-thumb.jpg',
    'rasa/clip': 'dashboard-RASA-clip.jpg',
}

app = Flask(__name__)

# Stop Flask from telling the browser to cache our onemetre_generated_data
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = -1

# Read secret data from the database
db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
with db.cursor() as cur:
    query = 'SELECT keyname, value from dashboard_config WHERE 1'
    cur.execute(query)
    for x in cur:
        app.config[x[0]] = x[1]
db.close()

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

def is_github_team_member(user, team_id):
    """Queries the GitHub API to check if the given user is a member of the given team."""
    team = github.get('teams/' + str(team_id) + '/memberships/' + user.data['login']).data
    return 'state' in team and team['state'] == 'active'

def get_user_account():
    """Queries user account details from the local cache or GitHub API
       Returns a dictionary with fields:
          'username': GitHub username (or None if not logged in)
          'avatar': GitHub profile picture (or None if not logged in)
          'permissions': list of permission types, a subset of
                         ['onemetre', 'nites', 'goto', 'rasa', 'infrastructure_log']
    """
    # Expire cached sessions after 12 hours
    # This forces the permissions to be queried again from github
    db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
    try:
        try:
            with db.cursor() as cur:
                cur.execute('DELETE FROM `dashboard_sessions` WHERE `timestamp` < ADDDATE(NOW(), INTERVAL -12 HOUR)')
        except Exception as e:
            print('Failed to clean expired session data with error')
            print(e)

        # Check whether we have received a callback argument from a login attempt
        if 'code' in request.args:
            resp = github.authorized_response()
            if resp is not None and 'access_token' in resp:
                session['github_token'] = resp['access_token']

        # Logged in users store an encrypted version of their github token in the session cookie
        if 'github_token' in session:
            # Check whether we have any cached state
            try:
                with db.cursor() as cur:
                    query = 'SELECT data from `dashboard_sessions` WHERE github_token = %s'
                    if cur.execute(query, (session['github_token'],)):
                        return json.loads(cur.fetchone()[0])
            except Exception as e:
                print('Failed to query local session data with error')
                print(e)

            # Query user data and permissions from GitHub
            try:
                user = github.get('user')
                permissions = set()

                # https://github.com/orgs/warwick-one-metre/teams/observers
                if is_github_team_member(user, 2128810):
                    permissions.update(['onemetre', 'infrastructure_log', 'rasa'])

                # https://github.com/orgs/NITES-40cm/teams/observers
                if is_github_team_member(user, 2576073):
                    permissions.update(['nites', 'infrastructure_log'])

                # https://github.com/orgs/GOTO-OBS/teams/ops-team/
                if is_github_team_member(user, 2308649):
                    permissions.update(['goto', 'infrastructure_log', 'rasa'])

                data = {
                    'username': user.data['login'],
                    'avatar': user.data['avatar_url'],
                    'permissions': list(permissions)
                }

                # Cache the state for next time
                with db.cursor() as cur:
                    query = 'REPLACE into `dashboard_sessions` (`github_token`, `data`) VALUES (%s, %s)'
                    cur.execute(query, (session['github_token'], json.dumps(data)))

                return data
            except Exception as e:
                print('Failed to query GitHub API with error')
                print(e)

        return {
            'username': None,
            'avatar': None,
            'permissions': []
        }
    finally:
        db.close()

@github.tokengetter
def get_github_oauth_token():
    """Fetch the github oauth token.
       Used internally by the OAuth API"""
    return (session.get('github_token'), '')

def __parse_dashboard_mode():
    try:
        return request.args.get('dashboard') == 'true'
    except:
        pass
    return False

@app.route('/login')
def login():
    callback = request.args['next'] if 'next' in request.args else url_for('environment', _external=True)
    return github.authorize(callback=callback)

@app.route('/logout')
def logout():
    next = request.args['next'] if 'next' in request.args else url_for('environment')
    token = session.pop('github_token', None)
    if token:
        # Restore the connection if needed
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
        with db.cursor() as cur:
            cur.execute('DELETE FROM `dashboard_sessions` WHERE `github_token` = %s', (token,))
        db.close()

    return redirect(next)

# Main pages
@app.route('/')
def main_redirect():
    return redirect(url_for('environment'))

@app.route('/onemetre/')
def onemetre_dashboard():
    return render_template('onemetre/dashboard.html', user_account=get_user_account())

@app.route('/onemetre/live/')
def onemetre_live():
    account = get_user_account()
    if 'onemetre' in account['permissions']:
        return render_template('onemetre/live.html', user_account=account)
    abort(404)

@app.route('/onemetre/dome/')
def onemetre_dome():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('onemetre/dome.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)

@app.route('/onemetre/resources/')
def onemetre_resources():
    account = get_user_account()
    if 'onemetre' in account['permissions']:
        return render_template('onemetre/resources.html', user_account=account)
    abort(404)

@app.route('/rasa/')
def rasa_dashboard():
    return render_template('rasa/dashboard.html', user_account=get_user_account())

@app.route('/rasa/live/')
def rasa_live():
    account = get_user_account()
    if 'rasa' in account['permissions']:
        return render_template('rasa/live.html', user_account=account)
    abort(404)

@app.route('/rasa/dome/')
def rasa_dome():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('rasa/dome.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)

@app.route('/nites/dome/')
def nites_dome():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('nites/dome.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)

# disabled until we can display all information
#@app.route('/goto/')
def goto_dashboard():
    return render_template('goto/dashboard.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)

@app.route('/goto/dome/')
def goto_dome():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('goto/dome.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)

@app.route('/goto/resources/')
def goto_resources():
    account = get_user_account()
    if 'goto' in account['permissions']:
        return render_template('goto/resources.html', user_account=account)
    abort(404)

@app.route('/environment/')
def environment():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('environment.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)

@app.route('/infrastructure/')
def infrastructure():
    return render_template('infrastructure.html', user_account=get_user_account())

@app.route('/skycams/')
def skycams():
    return render_template('skycams.html', user_account=get_user_account())

@app.route('/eastcam/')
def east_camera():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('east.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)

@app.route('/westcam/')
def west_camera():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('west.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)

# Dynamically generated JSON
@app.route('/data/onemetre/log')
def onemetre_log():
    account = get_user_account()
    if 'onemetre' in account['permissions']:
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
        try:
            # Returns latest 250 log messages.
            # If 'from' argument is present, returns latest 100 log messages with a greater id
            with db.cursor() as cur:
                query = 'SELECT id, date, type, source, message from obslog'
                query += " WHERE source IN ('environmentd', 'powerd', 'domed', 'opsd', 'red_camd', 'blue_camd', 'diskspaced', 'pipelined', 'teld')"
                if 'from' in request.args:
                    query += ' AND id > ' + db.escape(request.args['from'])

                query += ' ORDER BY id DESC LIMIT 250;'
                print(query)
                cur.execute(query)
                messages = [(x[0], x[1].isoformat(), x[2], x[3], x[4]) for x in cur]
                return jsonify(messages=messages)
        finally:
            db.close()
    abort(404)

@app.route('/data/rasa/log')
def rasa_log():
    account = get_user_account()
    if 'rasa' in account['permissions']:
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
        try:
            # Returns latest 250 log messages.
            # If 'from' argument is present, returns latest 100 log messages with a greater id
            with db.cursor() as cur:
                query = 'SELECT id, date, type, source, message from obslog'
                query += " WHERE source IN ('rasa_environmentd', 'rasa_powerd', 'rasa_domed', 'rasa_opsd', 'rasa_camd', 'rasa_diskspaced', 'rasa_pipelined', 'rasa_teld', 'rasa_focusd')"
                if 'from' in request.args:
                    query += ' AND id > ' + db.escape(request.args['from'])

                query += ' ORDER BY id DESC LIMIT 250;'
                print(query)
                cur.execute(query)
                messages = [(x[0], x[1].isoformat(), x[2], x[3], x[4]) for x in cur]
                return jsonify(messages=messages)
        finally:
            db.close()
    abort(404)

@app.route('/data/infrastructure/log')
def infrastructure_log():
    account = get_user_account()
    if 'infrastructure_log' in account['permissions']:
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
        try:
            # Returns latest 250 log messages.
            # If 'from' argument is present, returns latest 100 log messages with a greater id
            with db.cursor() as cur:
                query = 'SELECT id, date, type, source, message from obslog'
                query += " WHERE source IN ('dashboardd', 'tngd', 'netpingd', 'raind', 'vaisalad', 'goto_vaisalad', 'onemetre_roomalertd', 'nites_roomalertd', 'goto_roomalertd', 'superwaspd')"
                if 'from' in request.args:
                    query += ' AND id > ' + db.escape(request.args['from'])

                query += ' ORDER BY id DESC LIMIT 250;'
                cur.execute(query)
                messages = [(x[0], x[1].isoformat(), x[2], x[3], x[4]) for x in cur]
                return jsonify(messages=messages)
        finally:
            db.close()
    abort(404)

@app.route('/data/environment')
def environment_data():
    date = request.args['date'] if 'date' in request.args else None
    data, start, end = environment_json.environment_json(date)

    response = jsonify(data=data, start=start, end=end)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@app.route('/data/infrastructure')
def infrastructure_data():
    date = request.args['date'] if 'date' in request.args else None
    data, start, end = environment_json.infrastructure_json(date)

    response = jsonify(data=data, start=start, end=end)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@app.route('/data/onemetre/')
def onemetre_dashboard_data():
    data = json.load(open(GENERATED_DATA_DIR + '/onemetre-public.json'))
    account = get_user_account()
    if 'onemetre' in account['permissions']:
        data.update(json.load(open(GENERATED_DATA_DIR + '/onemetre-private.json')))

    return jsonify(**data)

@app.route('/data/onemetre/<path:path>')
def onemetre_generated_data(path):
    account = get_user_account()
    if 'onemetre' in account['permissions'] and path in ONEMETRE_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, ONEMETRE_GENERATED_DATA[path])
    abort(404)

@app.route('/data/rasa/')
def rasa_dashboard_data():
    data = json.load(open(GENERATED_DATA_DIR + '/rasa-public.json'))

    # Some private data is needed for the public info
    private = json.load(open(GENERATED_DATA_DIR + '/rasa-private.json'))

    account = get_user_account()
    if 'rasa' in account['permissions']:
        data.update(private)

    # Extract safe public info from private daemons

    # Tel status:
    #   0: error
    #   1: offline
    #   2: online
    tel_status = 0
    if 'telescope' in private and 'state' in private['telescope']:
        tel_status = 2 if private['telescope']['state'] != 0 else 1

    # Dome status:
    #   0: error
    #   1: closed
    #   2: open
    dome_status = 0
    if 'dome' in private and 'closed' in private['dome'] and 'heartbeat_status' in private['dome']:
        if private['dome']['heartbeat_status'] != 2 and private['dome']['heartbeat_status'] != 3:
            dome_status = 2 if not private['dome']['closed'] else 1

    dome_mode = 0
    if 'ops' in private and 'dome' in private['ops'] and 'mode' in private['ops']['dome']:
        dome_mode = private['ops']['dome']['mode']

    tel_mode = 0
    if 'ops' in private and 'telescope' in private['ops'] and 'mode' in private['ops']['dome']:
        tel_mode = private['ops']['telescope']['mode']

    env = {}
    if 'ops' in private and 'environment' in private['ops']:
        env = private['ops']['environment']

    data['status'] = {
        'tel': tel_status,
        'dome': dome_status,
        'tel_mode': tel_mode,
        'dome_mode': dome_mode,
        'environment': env
    }

    return jsonify(**data)

@app.route('/data/rasa/<path:path>')
def rasa_generated_data(path):
    account = get_user_account()
    if 'rasa' in account['permissions'] and path in RASA_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, RASA_GENERATED_DATA[path])
    abort(404)

def extract_onemetre_environment(data, group):
    """Extract a minimal set of data from the onemetre environment
       output for use on other dashboard pages"""
    if 'environment' not in data or group not in data['environment']:
        return {}

    ret = {}
    for k in data['environment'][group]:
        v = data['environment'][group][k]
        ret[k] = {'current': v['current']}
        if v['current']:
            ret[k]['latest'] = round(v['latest'], 2)

    return ret

@app.route('/data/goto/')
def goto_dashboard_data():
    data = json.load(open(GENERATED_DATA_DIR + '/goto-public.json'))

    # Extract additional data from the 1m dashboard
    onemetre = json.load(open(GENERATED_DATA_DIR + '/onemetre-public.json'))
    data.update({
        'onemetre': {
            'superwasp': extract_onemetre_environment(onemetre, 'superwasp'),
            'goto_vaisala': extract_onemetre_environment(onemetre, 'goto_vaisala'),
            'tng': extract_onemetre_environment(onemetre, 'tng'),
            'ephem': extract_onemetre_environment(onemetre, 'ephem')
        }
    })

    account = get_user_account()
    if 'goto' in account['permissions']:
        data.update(json.load(open(GENERATED_DATA_DIR + '/goto-private.json')))

    return jsonify(**data)

# Raw sensor data for GOTO ops
@app.route('/data/raw/onemetre-vaisala')
def raw_onemetre_vaisala():
    data = json.load(open(GENERATED_DATA_DIR + '/onemetre-vaisala.json'))
    return jsonify(**data)

@app.route('/data/raw/goto-vaisala')
def raw_goto_vaisala():
    data = json.load(open(GENERATED_DATA_DIR + '/goto-vaisala.json'))
    return jsonify(**data)

@app.route('/data/raw/superwasp-log')
def raw_superwasp_log():
    data = json.load(open(GENERATED_DATA_DIR + '/superwasp-log.json'))
    return jsonify(**data)

@app.route('/data/raw/netping')
def raw_netping():
    data = json.load(open(GENERATED_DATA_DIR + '/netping.json'))
    return jsonify(**data)
