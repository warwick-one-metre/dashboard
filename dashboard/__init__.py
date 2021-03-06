#
# observatory-dashboard is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# observatory-dashboard is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with observatory-dashboard.  If not, see <http://www.gnu.org/licenses/>.

# pylint: disable=invalid-name

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
from flask_github import GitHub

from warwick.observatory.common import daemons

from dashboard import environment_json

# pylint: disable=missing-docstring

# Log and weather data are stored in the database
DATABASE_DB = 'ops'
DATABASE_USER = 'ops'

GENERATED_DATA_DIR = '/srv/dashboard/generated'
W1M_GENERATED_DATA = {
    'blue': 'dashboard-BLUE.json',
    'blue/image': 'dashboard-BLUE-thumb.png',
    'red': 'dashboard-RED.json',
    'red/image': 'dashboard-RED-thumb.png',
}

WASP_GENERATED_DATA = {
    'wasp': 'dashboard-wasp.json',
    'wasp/thumb': 'dashboard-wasp-thumb.jpg',
    'wasp/clip': 'dashboard-wasp-clip.jpg',
}

EUMETSAT_GENERATED_DATA = {
    'ir': 'eumetsat-ir.jpg',
    'dust': 'eumetsat-dust.jpg',
}

WEBCAM_GENERATED_DATA = {
    'clasp/static': 'webcam-clasp.jpg'
}

app = Flask(__name__)

# Stop Flask from telling the browser to cache dynamic files
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
github = GitHub(app)


def is_github_team_member(user, team_id):
    """Queries the GitHub API to check if the given user is a member of the given team."""
    try:
        team = github.get('teams/' + str(team_id) + '/memberships/' + user['login'])
        return 'state' in team and team['state'] == 'active'
    except:
        # An exception is generated if the current user is not authenticated
        return False


def get_user_account():
    """Queries user account details from the local cache or GitHub API
       Returns a dictionary with fields:
          'username': GitHub username (or None if not logged in)
          'avatar': GitHub profile picture (or None if not logged in)
          'permissions': list of permission types, a subset of
                         ['w1m', 'goto', 'satellites', 'infrastructure_log']
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
                    permissions.update(['w1m', 'infrastructure_log', 'satellites'])

                # https://github.com/orgs/GOTO-OBS/teams/ops-team/
                if is_github_team_member(user, 2308649):
                    permissions.update(['goto', 'infrastructure_log'])

                data = {
                    'username': user['login'],
                    'avatar': user['avatar_url'],
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


@github.access_token_getter
def get_github_oauth_token():
    """Fetch the github oauth token.
       Used internally by the OAuth API"""
    return session.get('github_token')


def __parse_dashboard_mode():
    try:
        return request.args.get('dashboard') == 'true'
    except:
        pass
    return False


@app.route('/login-callback')
@github.authorized_handler
def authorized(oauth_token):
    next_url = request.args.get('next') or url_for('environment')
    if oauth_token:
        session['github_token'] = oauth_token

    return redirect(next_url)


@app.route('/login')
def login():
    return github.authorize(scope='read:org')


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


@app.route('/w1m/')
def w1m_dashboard():
    return render_template('w1m/dashboard.html', user_account=get_user_account())


@app.route('/w1m/live/')
def w1m_live():
    account = get_user_account()
    if 'w1m' in account['permissions']:
        return render_template('w1m/live.html', user_account=account)
    abort(404)


@app.route('/w1m/dome/')
def w1m_dome():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('w1m/dome.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


@app.route('/w1m/resources/')
def w1m_resources():
    account = get_user_account()
    if 'w1m' in account['permissions']:
        return render_template('w1m/resources.html', user_account=account)
    abort(404)


@app.route('/clasp/dome/')
def clasp_dome():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('clasp/dome.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


@app.route('/wasp/dome1/')
def wasp_dome1():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('wasp/dome1.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


@app.route('/wasp/dome2/')
def wasp_dome2():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('wasp/dome2.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


@app.route('/wasp/')
def wasp_dashboard():
    return render_template('wasp/dashboard.html', user_account=get_user_account())


@app.route('/wasp/live/')
def wasp_live():
    account = get_user_account()
    if 'satellites' in account['permissions']:
        return render_template('wasp/live.html', user_account=account)
    abort(404)


@app.route('/data/wasp/<path:path>')
def wasp_generated_data(path):
    account = get_user_account()
    if 'satellites' in account['permissions'] and path in WASP_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, WASP_GENERATED_DATA[path])
    abort(404)


@app.route('/goto/')
def goto_dashboard():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('goto/dashboard.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


@app.route('/goto/dome1/')
def goto_dome_1():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('goto/dome1.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


@app.route('/goto/dome2/')
def goto_dome_2():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('goto/dome2.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


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


@app.route('/data/eumetsat/<path:path>')
def eumetsat_generated_data(path):
    if path in EUMETSAT_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, EUMETSAT_GENERATED_DATA[path])
    abort(404)


@app.route('/webcam/<path:path>')
def webcam_generated_data(path):
    if path in WEBCAM_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, WEBCAM_GENERATED_DATA[path])
    abort(404)


@app.route('/eastcam/')
def east_camera():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('east.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


@app.route('/westcam/')
def west_camera():
    dashboard_mode = __parse_dashboard_mode()
    return render_template('west.html', user_account=get_user_account(), dashboard_mode=dashboard_mode)


@app.route('/light/<light>/<state>')
def switch_light(light, state):
    account = get_user_account()
    if state in ['on', 'off']:
        if light == 'w1m' and 'w1m' in account['permissions']:
            with daemons.onemetre_power.connect() as power:
                power.dashboard_switch('light', state == 'on', account['username'])
            return jsonify({})

        if light == 'goto1' and 'goto' in account['permissions']:
            with daemons.goto_gtecs_power.connect() as power:
                power.dashboard_switch('leds', state == 'on', account['username'])
            return jsonify({})

        if (light == 'wasp1' or light == 'wasp2') and 'satellites' in account['permissions']:
            with daemons.superwasp_power.connect() as power:
                power.dashboard_switch('ilight' if light == 'wasp1' else 'clight', state == 'on', account['username'])
            return jsonify({})

    abort(404)


@app.route('/override/<telescope>/<state>')
def set_override(telescope, state):
    account = get_user_account()
    if state in ['on', 'off']:
        if telescope == 'goto' and 'goto' in account['permissions']:
            with daemons.goto_gtecs_conditions.connect() as conditions:
                conditions.dashboard_override(state == 'on', account['username'])
            return jsonify({})

    abort(404)


# Dynamically generated JSON
@app.route('/data/w1m/log')
def w1m_log():
    account = get_user_account()
    if 'w1m' in account['permissions']:
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
        try:
            # Returns latest 250 log messages.
            # If 'from' argument is present, returns latest 100 log messages with a greater id
            with db.cursor() as cur:
                query = 'SELECT id, date, type, source, message from obslog'
                query += " WHERE source IN ('powerd', 'domed', 'opsd', 'red_camd', 'blue_camd', 'diskspaced', 'pipelined', 'teld')"
                if 'from' in request.args:
                    query += ' AND id > ' + db.escape(request.args['from'])

                query += ' ORDER BY id DESC LIMIT 250;'
                cur.execute(query)
                messages = [(x[0], x[1].isoformat(), x[2], x[3], x[4]) for x in cur]
                return jsonify(messages=messages)
        finally:
            db.close()
    abort(404)


@app.route('/data/wasp/log')
def wasp_log():
    account = get_user_account()
    if 'satellites' in account['permissions']:
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
        try:
            # Returns latest 250 log messages.
            # If 'from' argument is present, returns latest 100 log messages with a greater id
            with db.cursor() as cur:
                query = 'SELECT id, date, type, source, message from obslog'
                query += " WHERE source IN ('wasp_leoobs', 'wasp_powerd')"
                if 'from' in request.args:
                    query += ' AND id > ' + db.escape(request.args['from'])

                query += ' ORDER BY id DESC LIMIT 250;'
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
                query += " WHERE source IN ('environmentd', 'dashboardd', 'tngd', 'netpingd', 'raind', 'vaisalad', " \
                    "'goto_vaisalad', 'onemetre_roomalertd', 'nites_roomalertd', 'goto_roomalertd', 'superwaspd', " \
                    "'iropacityd', 'gotoupsd', 'waspupsd', 'robodimmd', 'wasp_roofbatteryd', 'aircond')"

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


@app.route('/data/w1m/')
def w1m_dashboard_data():
    data = json.load(open(GENERATED_DATA_DIR + '/onemetre-public.json'))

    # Some private data is needed for the public info
    private = json.load(open(GENERATED_DATA_DIR + '/onemetre-private.json'))

    account = get_user_account()
    if 'w1m' in account['permissions']:
        data.update(private)

    # Extract safe public info from private daemons
    private_ops = private.get('w1m_ops', {})
    private_dome = private.get('w1m_dome', {})
    private_telescope = private.get('w1m_telescope', {})

    # Tel status:
    #   0: error
    #   1: offline
    #   2: online
    tel_status = 0
    if 'state' in private_telescope:
        tel_status = 1 if private_telescope['state'] == 0 else 2

    # Dome status:
    #   0: error
    #   1: closed
    #   2: open
    dome_status = 0
    if 'closed' in private_dome and 'heartbeat_status' in private_dome:
        if private_dome['heartbeat_status'] not in [2, 3]:
            dome_status = 1 if private_dome['closed'] else 2

    dome_mode = 0
    if 'dome' in private_ops and 'mode' in private_ops['dome']:
        dome_mode = private_ops['dome']['mode']

    tel_mode = 0
    if 'telescope' in private_ops and 'mode' in private_ops['telescope']:
        tel_mode = private_ops['telescope']['mode']

    dehumidifier_mode = 0
    if 'dehumidifier' in private_ops and 'mode' in private_ops['dehumidifier']:
        dehumidifier_mode = private_ops['dehumidifier']['mode']

    env = {}
    if 'environment' in private_ops:
        env = private_ops['environment']

    data['w1m_status'] = {
        'tel': tel_status,
        'dome': dome_status,
        'tel_mode': tel_mode,
        'dome_mode': dome_mode,
        'dehumidifier_mode': dehumidifier_mode,
        'environment': env
    }

    return jsonify(**data)


@app.route('/data/w1m/<path:path>')
def w1m_generated_data(path):
    account = get_user_account()
    if 'w1m' in account['permissions'] and path in W1M_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, W1M_GENERATED_DATA[path])
    abort(404)


@app.route('/data/goto/')
def goto_dashboard_data():
    data = json.load(open(GENERATED_DATA_DIR + '/goto-public.json'))

    # Some private data is needed for the public info
    private = json.load(open(GENERATED_DATA_DIR + '/goto-private.json'))

    account = get_user_account()
    if 'goto' in account['permissions']:
        data.update(private)
    else:
        data['goto_conditions'] = private['goto_conditions']

        data['goto_dome'] = {
            'mode': private['goto_dome']['mode'],
            'dome': private['goto_dome']['dome'],
            'lockdown': private['goto_dome']['lockdown'],
            'dehumidifier_on': private['goto_dome']['dehumidifier_on'],
            'hatch': private['goto_dome']['hatch']
        }

        data['goto_power'] = {
            'status_UPS1': private['goto_power']['status_UPS1'],
            'status_UPS2': private['goto_power']['status_UPS2'],
            'status_PDU1': {
                'leds1': private['goto_power']['status_PDU1']['leds1'],
            },
            'status_PDU2': {
                'leds2': private['goto_power']['status_PDU2']['leds2'],
            }
        }

    return jsonify(**data)


@app.route('/data/wasp/')
def wasp_dashboard_data():
    data = json.load(open(GENERATED_DATA_DIR + '/wasp-public.json'))

    # Some private data is needed for the public info
    private = json.load(open(GENERATED_DATA_DIR + '/wasp-private.json'))

    account = get_user_account()
    if 'satellites' in account['permissions']:
        data.update(private)

    # Extract safe public info from private daemons
    private_leoobs = private.get('leoobs', {})
    roof_status = private_leoobs.get('roof_status', 0)

    env = {}
    if 'environment' in private_leoobs:
        env = private_leoobs['environment']

    data['wasp_status'] = {
        'roof': roof_status,
        'environment': env
    }

    return jsonify(**data)


# Raw sensor data for GOTO ops
@app.route('/data/raw/w1m-vaisala')
def raw_w1m_vaisala():
    data = json.load(open(GENERATED_DATA_DIR + '/onemetre-vaisala.json'))
    return jsonify(**data)


@app.route('/data/raw/goto-vaisala')
def raw_goto_vaisala():
    data = json.load(open(GENERATED_DATA_DIR + '/goto-vaisala.json'))
    return jsonify(**data)


@app.route('/data/raw/netping')
def raw_netping():
    data = json.load(open(GENERATED_DATA_DIR + '/netping.json'))
    return jsonify(**data)


@app.route('/data/raw/goto-dome1-roomalert')
def raw_goto_dome1_roomalert():
    data = json.load(open(GENERATED_DATA_DIR + '/goto-dome1-roomalert.json'))
    return jsonify(**data)


@app.route('/data/raw/goto-dome2-roomalert')
def raw_goto_dome2_roomalert():
    data = json.load(open(GENERATED_DATA_DIR + '/goto-dome2-roomalert.json'))
    return jsonify(**data)


@app.route('/data/raw/goto-dome2-sht35')
def raw_goto_dome2_sht35():
    data = json.load(open(GENERATED_DATA_DIR + '/goto-dome2-sht35.json'))
    return jsonify(**data)
