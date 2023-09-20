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
import os.path

import pymysql
import requests
from requests.auth import HTTPDigestAuth
from astropy.time import Time
import astropy.units as u

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
from werkzeug.exceptions import NotFound

# pylint: disable=missing-docstring

# Log and weather data are stored in the database
DATABASE_DB = 'ops'
DATABASE_USER = 'ops'

GENERATED_DATA_DIR = '/srv/dashboard/generated'
if not os.path.exists(GENERATED_DATA_DIR):
    GENERATED_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'generated')

W1M_GENERATED_DATA = {
    'blue/thumb': 'dashboard-BLUE-thumb.jpg',
    'blue/clip': 'dashboard-BLUE-clip.jpg',
    'red/thumb': 'dashboard-RED-thumb.jpg',
    'red/clip': 'dashboard-RED-clip.jpg',
}

CLASP_GENERATED_DATA = {
    'cam1/thumb': 'dashboard-CAM1-thumb.jpg',
    'cam1/clip': 'dashboard-CAM1-clip.jpg',
    'cam2/thumb': 'dashboard-CAM2-thumb.jpg',
    'cam2/clip': 'dashboard-CAM2-clip.jpg',
}

HALFMETRE_GENERATED_DATA = {
    'thumb': 'dashboard-HALFMETRE-thumb.jpg',
    'clip': 'ddashboard-HALFMETRE-clip.jpg',
}

SUPERWASP_GENERATED_DATA = {
    'cam1/thumb': 'dashboard-1-thumb.jpg',
    'cam1/clip': 'dashboard-1-clip.jpg',
    'cam2/thumb': 'dashboard-2-thumb.jpg',
    'cam2/clip': 'dashboard-2-clip.jpg',
    'cam3/thumb': 'dashboard-3-thumb.jpg',
    'cam3/clip': 'dashboard-3-clip.jpg',
    'cam4/thumb': 'dashboard-4-thumb.jpg',
    'cam4/clip': 'dashboard-4-clip.jpg',
}

EUMETSAT_GENERATED_DATA = {
    'ir': 'eumetsat-ir.jpg',
    'dust': 'eumetsat-dust.jpg',
}


app = Flask(__name__, static_folder='../static')

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

# Use GitHub's OAuth interface for verifying user identity
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
    return {
        'username': 'pchote',
        'avatar': 'https://avatars.githubusercontent.com/u/167819?v=4',
        'permissions': ['satellites', 'infrastructure_log', 'w1m', 'halfmetre', 'goto']
    }
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

        # Logged-in users store an encrypted version of their GitHub token in the session cookie
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
                    permissions.update(['w1m', 'halfmetre', 'infrastructure_log', 'satellites'])

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
    """Fetch the GitHub oauth token.
       Used internally by the OAuth API"""
    return session.get('github_token')


@app.route('/login-callback')
@github.authorized_handler
def authorized(oauth_token):
    next_url = request.args.get('next') or url_for('site_overview')
    if oauth_token:
        session['github_token'] = oauth_token

    return redirect(next_url)


@app.route('/login')
def login():
    return github.authorize(scope='read:org')


@app.route('/logout')
def logout():
    next_url = request.args['next'] if 'next' in request.args else url_for('site_overview')
    token = session.pop('github_token', None)
    if token:
        # Restore the connection if needed
        db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
        with db.cursor() as cur:
            cur.execute('DELETE FROM `dashboard_sessions` WHERE `github_token` = %s', (token,))
        db.close()

    return redirect(next_url)


# Main pages

@app.route('/w1m/')
def w1m_dashboard():
    account = get_user_account()
    if 'w1m' not in account['permissions']:
        return redirect(url_for('site_overview'))

    return render_template('onemetre.html', user_account=get_user_account())


@app.route('/clasp/')
def clasp_dashboard():
    account = get_user_account()
    if 'satellites' not in account['permissions']:
        return redirect(url_for('site_overview'))

    return render_template('clasp.html', user_account=get_user_account())


@app.route('/data/clasp/<path:path>')
def clasp_generated_data(path):
    account = get_user_account()
    if 'satellites' in account['permissions'] and path in CLASP_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, CLASP_GENERATED_DATA[path])
    abort(404)


@app.route('/superwasp/')
def superwasp_dashboard():
    account = get_user_account()
    if 'satellites' not in account['permissions']:
        return redirect(url_for('site_overview'))

    return render_template('superwasp.html', user_account=get_user_account())


@app.route('/data/superwasp/<path:path>')
def superwasp_generated_data(path):
    account = get_user_account()
    if 'satellites' in account['permissions'] and path in SUPERWASP_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, SUPERWASP_GENERATED_DATA[path])
    abort(404)


@app.route('/halfmetre/')
def halfmetre_dashboard():
    account = get_user_account()
    if 'halfmetre' not in account['permissions']:
        return redirect(url_for('site_overview'))

    return render_template('halfmetre.html', user_account=get_user_account())


@app.route('/data/halfmetre/<path:path>')
def halfmetre_generated_data(path):
    account = get_user_account()
    if 'halfmetre' in account['permissions'] and path in HALFMETRE_GENERATED_DATA:
        print(HALFMETRE_GENERATED_DATA[path])
        return send_from_directory(GENERATED_DATA_DIR, HALFMETRE_GENERATED_DATA[path])
    abort(404)

@app.route('/goto/')
def goto_dashboard():
    account = get_user_account()
    if 'goto' not in account['permissions']:
        return redirect(url_for('site_overview'))

    return render_template('goto.html', user_account=get_user_account())


@app.route('/environment/')
def environment():
    return render_template('environment.html', user_account=get_user_account())


@app.route('/infrastructure/')
def infrastructure():
    return render_template('infrastructure.html', user_account=get_user_account())


class SiteCamera:
    def __init__(self, id, label, authorised=False, video=False, audio=False, light=False, infrared=False, source=None):
        self.id = id
        self.label = label
        self.source_url = source or ''
        self.camera_url = '/camera/' + id
        self.video_url = '/video/' + id if video and authorised else ''
        self.audio_url = 'wss://lapalma-observatory.warwick.ac.uk/microphone/' + id if audio and authorised else ''
        self.light_url = '/light/' + id if light and authorised else ''
        self.infrared_url = '/light/' + id + 'ir' if infrared and authorised else ''


@app.route('/cameras')
def cameras_redirect():
    return redirect(url_for('site_overview'))


@app.route('/')
def site_overview():
    user_account = get_user_account()
    authorised_goto = user_account is not None and 'goto' in user_account['permissions']
    authorised_satellites = user_account is not None and 'satellites' in user_account['permissions']
    authorised_onemetre = user_account is not None and 'w1m' in user_account['permissions']
    authorised_halfmetre = user_account is not None and 'halfmetre' in user_account['permissions']
    authorised_extcams = authorised_goto or authorised_satellites

    authorised = len(user_account['permissions']) > 0

    external_cameras = [
        SiteCamera('ext1', 'West Camera', authorised=authorised_extcams, video=True),
        SiteCamera('ext2', 'East Camera', authorised=authorised_extcams, video=True),
        SiteCamera('allsky', 'All-Sky'),
        SiteCamera('gtcsky', 'GTC All-Sky', source='http://www.gtc.iac.es/multimedia/webcams.php'),
        SiteCamera('eumetsat', 'EUMETSAT 10.8 um', source='https://eumetview.eumetsat.int/static-images/MSG/IMAGERY/IR108/BW/index.htm'),
    ]

    internal_cameras = []
    camera_height = 452
    if authorised:
        camera_height = 544
        external_cameras.append(SiteCamera('serverroom', 'Server Room', authorised=authorised_extcams, video=True, audio=False, light=True))
        internal_cameras = [
            SiteCamera('goto1', 'GOTO 1', authorised=authorised_goto, video=True, audio=True, light=True, infrared=True),
            SiteCamera('goto2', 'GOTO 2', authorised=authorised_goto, video=True, audio=True, light=True, infrared=True),
            SiteCamera('halfmetre', 'Half Metre', authorised=authorised_halfmetre, video=True, audio=True, light=True, infrared=True),
            SiteCamera('w1m', 'W1m', authorised=authorised_onemetre, video=True, audio=True, light=True, infrared=True),
            SiteCamera('superwasp', 'SuperWASP', authorised=authorised_satellites, video=True, audio=True, light=True, infrared=True),
            SiteCamera('clasp', 'CLASP', authorised=authorised_satellites, video=True, audio=True, light=True, infrared=True)
        ]

    return render_template('overview.html',
                           user_account=user_account, authorised=authorised, camera_height=camera_height,
                           external_cameras=external_cameras, internal_cameras=internal_cameras)


@app.route('/camera/<path:camera>')
def camera_image(camera):
    authorised = len(get_user_account()['permissions']) > 0
    if camera in ['ext1', 'ext2', 'allsky', 'gtcsky', 'eumetsat'] or (authorised and camera in ['serverroom', 'goto1', 'goto2', 'halfmetre', 'w1m', 'superwasp', 'clasp']):
        return send_from_directory(os.path.join(GENERATED_DATA_DIR, 'cameras'), camera + '.jpg')
    abort(404)


@app.route('/camera/<path:camera>/thumb')
def camera_thumb(camera):
    authorised = len(get_user_account()['permissions']) > 0
    if camera in ['ext1', 'ext2', 'allsky', 'gtcsky', 'eumetsat'] or (authorised and camera in ['serverroom', 'goto1', 'goto2', 'halfmetre', 'w1m', 'superwasp', 'clasp']):
        return send_from_directory(os.path.join(GENERATED_DATA_DIR, 'cameras'), camera + '_thumb.jpg')
    abort(404)


def _toggle_leds(daemon, light, account, state):
    with daemon.connect() as power:
        power.dashboard_switch(light, state == 'on', account['username'])
    return jsonify({})


def _toggle_webcam_ir(ip, password, enabled):
    data = json.dumps({
        'apiVersion': '1.2',
        'method': 'enableLight' if enabled else 'disableLight',
        'params': {'lightID': 'led0'}
    })

    requests.post('http://{}/axis-cgi/lightcontrol.cgi'.format(ip), data=data, auth=HTTPDigestAuth('root', password))
    return jsonify({})


@app.route('/light/<light>/<state>')
def switch_light(light, state):
    account = get_user_account()

    if state in ['on', 'off']:
        if light == 'w1m' and 'w1m' in account['permissions']:
            return _toggle_leds(daemons.onemetre_power, 'light', account, state)

        if light == 'goto1' and 'goto' in account['permissions']:
            return _toggle_leds(daemons.goto_dome1_gtecs_power, 'leds', account, state)

        if light == 'goto2' and 'goto' in account['permissions']:
            return _toggle_leds(daemons.goto_dome2_gtecs_power, 'leds', account, state)

        if light == 'superwasp' and 'satellites' in account['permissions']:
            return _toggle_leds(daemons.superwasp_power, 'light', account, state)

        if (light in ['halfmetre', 'serverroom']) and 'satellites' in account['permissions']:
            return _toggle_leds(daemons.halfmetre_power, 'ilight' if light == 'wasp1' else 'clight', account, state)

        if light == 'clasp' and 'satellites' in account['permissions']:
            return _toggle_leds(daemons.clasp_power, 'light', account, state)

        if light == 'superwaspir' and 'satellites' in account['permissions']:
            return _toggle_webcam_ir('10.2.6.172', app.config['WEBCAM_SUPERWASP_PASSWORD'], state == 'on')

        if light == 'halfmetreir' and 'satellites' in account['permissions']:
            return _toggle_webcam_ir('10.2.6.118', app.config['WEBCAM_SUPERWASP_PASSWORD'], state == 'on')

        if light == 'w1mir' and 'w1m' in account['permissions']:
            return _toggle_webcam_ir('10.2.6.208', app.config['WEBCAM_W1M_PASSWORD'], state == 'on')

        if light == 'claspir' and 'satellites' in account['permissions']:
            return _toggle_webcam_ir('10.2.6.193', app.config['WEBCAM_CLASP_PASSWORD'], state == 'on')

    abort(404)


@app.route('/override/<telescope>/<state>')
def set_override(telescope, state):
    account = get_user_account()
    if state in ['on', 'off']:
        if telescope in ['goto1', 'goto2'] and 'goto' in account['permissions']:
            if telescope == 'goto1':
                daemon = daemons.goto_dome1_gtecs_conditions
            else:
                daemon = daemons.goto_dome2_gtecs_conditions

            with daemon.connect() as conditions:
                conditions.dashboard_override(state == 'on', account['username'])
            return jsonify({})

    abort(404)


def fetch_log_messages(sources):
    db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER, autocommit=True)
    try:
        # Returns latest 250 log messages.
        # If 'from' argument is present, returns latest 100 log messages with a greater id
        with db.cursor() as cur:
            args = list(sources.keys())
            in_list = ','.join(['%s'] * len(args))
            query = f'SELECT id, date, type, source, message from obslog WHERE source IN ({in_list})'
            if 'from' in request.args:
                query += ' AND id > %s'
                args.append(request.args['from'])

            query += ' ORDER BY id DESC LIMIT 250;'
            cur.execute(query, args)
            messages = [(x[0], x[1].isoformat(), x[2], sources[x[3]], x[4]) for x in cur]
            return jsonify(messages=messages)
    finally:
        db.close()


@app.route('/data/clasp/log')
def clasp_log():
    account = get_user_account()
    if 'satellites' not in account['permissions']:
        abort(404)

    return fetch_log_messages({
        'powerd@clasp': 'power',
        'lmountd@clasp': 'mount',
        'dome@clasp': 'dome',
        'opsd@clasp': 'ops',
        'focusd@clasp': 'focuser',
        'pipelined@clasp': 'pipeline',
        'qhy_camd@cam1': 'cam1',
        'raptor_camd@cam2': 'cam2',
        'diskspaced@clasp': 'diskspace',
        'dehumidifierd@clasp': 'dehumidifier'
    })


@app.route('/data/halfmetre/log')
def halfmetre_log():
    account = get_user_account()
    if 'halfmetre' not in account['permissions']:
        abort(404)

    return fetch_log_messages({
        'powerd@halfmetre': 'power',
        'lmountd@halfmetre': 'mount',
        'halfmetre_roof': 'roof',
        'opsd@halfmetre': 'ops',
        'pipelined@halfmetre': 'pipeline',
        'qhy_camd@halfmetre': 'cam',
        'diskspaced@halfmetre': 'diskspace',
        'focusd@halfmetre': 'focus'
    })


@app.route('/data/superwasp/log')
def superwasp_log():
    account = get_user_account()
    if 'satellites' not in account['permissions']:
        abort(404)

    return fetch_log_messages({
        'powerd@superwasp': 'power',
        'lmountd@superwasp': 'mount',
        'superwasp_dome': 'dome',
        'opsd@superwasp': 'ops',
        'pipelined@superwasp': 'pipeline',
        'qhy_camd@swasp-cam1': 'cam1',
        'qhy_camd@swasp-cam2': 'cam2',
        'qhy_camd@swasp-cam3': 'cam3',
        'qhy_camd@swasp-cam4': 'cam4',
        'diskspaced@superwasp_cam1': 'disk_das1',
        'diskspaced@superwasp_cam2': 'disk_das2',
        'diskspaced@superwasp_cam3': 'disk_das3',
        'diskspaced@superwasp_cam4': 'disk_das4',
        'dehumidifierd@superwasp': 'dehumidifier',
        'lensheaterd': 'lensheater'
    })


@app.route('/data/w1m/log')
def w1m_log():
    account = get_user_account()
    if 'w1m' not in account['permissions']:
        abort(404)

    return fetch_log_messages({
        'powerd': 'power',
        'teld': 'mount',
        'focusd@onemetre': 'focuser',
        'onemetre_dome': 'dome',
        'opsd@onemetre': 'ops',
        'pipelined': 'pipeline',
        'andor_camd@blue': 'cam_blue',
        'andor_camd@red': 'cam_red',
        'diskspaced': 'diskspace',
        'dehumidifierd@onemetre': 'dehumidifier'
    })


@app.route('/data/infrastructure/log')
def infrastructure_log():
    account = get_user_account()
    if 'infrastructure_log' not in account['permissions']:
        abort(404)

    return fetch_log_messages({
        'environmentd': 'Environment',
        'dashboardd': 'Dashboard',
        'tngd': 'TNG',
        'netpingd': 'Network',
        'vaisalad': 'W1m Vaiala',
        'goto_vaisalad': 'GOTO Vaisala',
        'vaisalad@halfmetre': '0.5m Vaisala',
        'cloudwatcherd@halfmetre': '0.5m Cloud Watcher',
        'powerd@gotoupsmon': 'GOTO UPS',
        'aircond': 'Server Rm. Aircon',
        'weatherlogd': 'Weather DB'
    })


def environment_json(base):
    now = Time.now()
    today = Time(now.datetime.strftime('%Y-%m-%d'), format='isot', scale='utc') + 12 * u.hour
    if today > now:
        today -= 1 * u.day

    path = 'latest.json.gz'
    if 'date' in request.args:
        # Map today's date to today.json
        # HACK: use .datetime to work around missing strftime on ancient astropy
        if today.strftime('%Y-%m-%d') == request.args['date']:
            path = 'today.json.gz'
        else:
            # Validate that it is a well-formed date
            date = Time(request.args['date'], format='isot', scale='utc')
            path = date.datetime.strftime('%Y/%Y-%m-%d.json.gz')

    try:
        response = send_from_directory(GENERATED_DATA_DIR, os.path.join(base, path))
        response.headers['Content-Encoding'] = 'gzip'
    except NotFound:
        start = today.unix * 1000,
        end = (today + 1 * u.day).unix * 1000,
        response = jsonify(data={}, start=start, end=end)

    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route('/data/overview')
def overview_data():
    response = send_from_directory(GENERATED_DATA_DIR, 'overview.json.gz')
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Content-Encoding'] = 'gzip'
    return response


@app.route('/data/environment')
def environment_data():
    return environment_json('environment')


@app.route('/data/infrastructure')
def infrastructure_data():
    return environment_json('infrastructure')


@app.route('/data/clasp/')
def clasp_dashboard_data():
    account = get_user_account()
    if 'satellites' not in account['permissions']:
        abort(404)

    data = json.load(open(GENERATED_DATA_DIR + '/clasp-public.json'))
    private = json.load(open(GENERATED_DATA_DIR + '/clasp-private.json'))
    data.update(private)

    data['previews'] = {
        'cam1': json.load(open(GENERATED_DATA_DIR + '/dashboard-CAM1.json')),
        'cam2': json.load(open(GENERATED_DATA_DIR + '/dashboard-CAM2.json'))
    }

    response = jsonify(**data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route('/data/w1m/')
def w1m_dashboard_data():
    account = get_user_account()
    if 'w1m' not in account['permissions']:
        abort(404)

    data = json.load(open(GENERATED_DATA_DIR + '/onemetre-public.json'))
    private = json.load(open(GENERATED_DATA_DIR + '/onemetre-private.json'))
    data.update(private)

    data['previews'] = {
        'blue': json.load(open(GENERATED_DATA_DIR + '/dashboard-BLUE.json')),
        'red': json.load(open(GENERATED_DATA_DIR + '/dashboard-RED.json'))
    }

    response = jsonify(**data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route('/data/w1m/<path:path>')
def w1m_generated_data(path):
    account = get_user_account()
    if 'w1m' in account['permissions'] and path in W1M_GENERATED_DATA:
        return send_from_directory(GENERATED_DATA_DIR, W1M_GENERATED_DATA[path])
    abort(404)


@app.route('/data/goto/')
def goto_dashboard_data():
    account = get_user_account()
    if 'goto' not in account['permissions']:
        abort(404)

    data = json.load(open(GENERATED_DATA_DIR + '/goto-public.json'))
    data.update(json.load(open(GENERATED_DATA_DIR + '/goto-dome1-private.json')))
    data.update(json.load(open(GENERATED_DATA_DIR + '/goto-dome2-private.json')))

    response = jsonify(**data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route('/data/superwasp/')
def superwasp_dashboard_data():
    account = get_user_account()
    if 'satellites' not in account['permissions']:
        abort(404)

    data = json.load(open(GENERATED_DATA_DIR + '/superwasp-public.json'))
    private = json.load(open(GENERATED_DATA_DIR + '/superwasp-private.json'))
    data.update(private)

    data['previews'] = {
        'cam1': json.load(open(GENERATED_DATA_DIR + '/dashboard-1.json')),
        'cam2': json.load(open(GENERATED_DATA_DIR + '/dashboard-2.json')),
        'cam3': json.load(open(GENERATED_DATA_DIR + '/dashboard-3.json')),
        'cam4': json.load(open(GENERATED_DATA_DIR + '/dashboard-4.json'))
    }

    response = jsonify(**data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route('/data/halfmetre/')
def halfmetre_dashboard_data():
    account = get_user_account()
    if 'halfmetre' not in account['permissions']:
        abort(404)

    data = json.load(open(GENERATED_DATA_DIR + '/halfmetre-public.json'))
    private = json.load(open(GENERATED_DATA_DIR + '/halfmetre-private.json'))
    data.update(private)

    data['previews'] = {
        'halfmetre': json.load(open(GENERATED_DATA_DIR + '/dashboard-HALFMETRE.json'))
    }

    response = jsonify(**data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


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
