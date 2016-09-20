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

import datetime
import pymysql

DATABASE_DB = 'ops'
DATABASE_USER = 'ops'

VAISALA = {
    'temperature': ('N<sub>2</sub>&nbsp;Plant', 'vexttemp', '#009DDC'),
    'relative_humidity': ('N<sub>2</sub>&nbsp;Plant', 'vexthumid', '#009DDC'),
    'wind_direction': ('N<sub>2</sub>&nbsp;Plant', 'vwinddir', '#009DDC'),
    'wind_speed': ('N<sub>2</sub>&nbsp;Plant', 'vwindspeed', '#009DDC'),
    'pressure': ('N<sub>2</sub>&nbsp;Plant', 'vpressure', '#009DDC'),
    'accumulated_rain': ('N<sub>2</sub>&nbsp;Plant&nbsp;(Accumulated mm)', 'vrain', '#009DDC'),
    'dew_point_delta': ('N<sub>2</sub>&nbsp;Plant&nbsp;', 'vdewdelta', '#009DDC')
}

ROOMALERT = {
    'internal_temp': ('1m&nbsp;Dome', 'rinttemp', '#F3A712'),
    'internal_humidity': ('1m&nbsp;Dome', 'rinthumid', '#F3A712'),
    'truss_temp': ('1m&nbsp;Truss', 'rtrusstemp', '#CEB5A7'),
    'roomalert_temp': ('1m&nbsp;Rack', 'rracktemp', '#FACC6B'),
    'roomalert_humidity': ('1m&nbsp;Rack', 'rrackhumid', '#FACC6B'),
}

NITES_ROOMALERT = {
    'internal_temperature': ('NITES&nbsp;Dome', 'ninttemp', '#DE0D92'),
    'internal_humidity': ('NITES&nbsp;Dome', 'ninthumid', '#DE0D92'),
    'rack_temperature': ('NITES&nbsp;Rack', 'nracktemp', '#B4436C'),
    'rack_humidity': ('NITES&nbsp;Rack', 'nrackhumid', '#B4436C'),
}

SUPERWASP = {
    'ext_temperature': ('SWASP', 'swtemp', '#F26430'),
    'ext_humidity': ('SWASP', 'swhumid', '#F26430'),
    'wind_speed': ('SWASP', 'swwindspeed', '#F26430'),
    'wind_direction': ('SWASP', 'swwinddir', '#F26430'),
    'sky_temp': ('SWASP', 'swskytemp', '#F26430'),
    'pressure': ('SWASP', 'swpressure', '#F26430'),
    'dew_point_delta': ('SWASP', 'swdewdelta', '#F26430'),
}

RAINDETECTOR = {
    'unsafe_boards': ('1m&nbsp;(Triggered&nbsp;boards)', 'rdboards', '#FDE74C')
}

UPS = {
    'main_ups_battery_remaining': ('1m&nbsp;Main', 'mupsbat', '#FDE74C'),
    'dome_ups_battery_remaining': ('1m&nbsp;Dome', 'dupsbat', '#009DDC'),
}

NETWORK = {
    'ngtshead': ('Warwick', 'ngtsping', '#FDE74C'),
    'google': ('Google', 'googleping', '#009DDC'),
}

def plot_json(date=None):
    try:
        start = datetime.datetime.strptime(date, '%Y-%m-%d') - datetime.timedelta(minutes=6)
        end = start + datetime.timedelta(hours=24, minutes=6)
    except:
        end = datetime.datetime.utcnow()
        start = end - datetime.timedelta(hours=6, minutes=6)

    start_str = start.isoformat()
    end_str = end.isoformat()
    start_js = int(start.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000)
    end_js = int(end.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000)

    db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER)
    data = __vaisala_json(db, start_str, end_str)
    data.update(__sensor_json(db, 'weather_onemetre_roomalert', ROOMALERT, start_str, end_str))
    data.update(__sensor_json(db, 'weather_superwasp', SUPERWASP, start_str, end_str))
    data.update(__sensor_json(db, 'weather_onemetre_raindetector', RAINDETECTOR, start_str, end_str))
    data.update(__sensor_json(db, 'weather_onemetre_ups', UPS, start_str, end_str))
    data.update(__sensor_json(db, 'weather_nites_roomalert', NITES_ROOMALERT, start_str, end_str))
    data.update(__sensor_json(db, 'weather_network', NETWORK, start_str, end_str))

    print('start: ', start, start_str, start_js)
    print('end: ', end, end_str, end_js)
    return data, start_js, end_js

def __sensor_json(db, table, channels, start, end):
    data = {}

    for key in channels:
        value = channels[key]
        c = {'label': value[0], 'color': value[2]}

        # TODO:do this in one query
        with db.cursor() as cur:
            query = 'SELECT `date`, `' + key + '` from `' + table + '` WHERE ' \
                + '`date` > ' + db.escape(start) + ' AND `date` <= ' \
                + db.escape(end) + ' ORDER BY `date` DESC;'
            cur.execute(query)
            c['data'] = [(int(x[0].replace(tzinfo=datetime.timezone.utc).timestamp() * 1000), x[1]) for x in cur]

        data[value[1]] = c
    return data

def __vaisala_json(db, start, end):
    channels = {}
    for key in VAISALA:
        value = VAISALA[key]
        c = {'label': value[0], 'color': value[2]}

        with db.cursor() as cur:
            query = 'SELECT `date`, `' + key + '` from `weather_onemetre_vaisala` WHERE `' \
                + key + '_valid` = 1 AND `date` > ' + db.escape(start) + ' AND `date` <= ' \
                + db.escape(end) + ' ORDER BY `date` DESC;'
            cur.execute(query)
            c['data'] = [(int(x[0].replace(tzinfo=datetime.timezone.utc).timestamp() * 1000), x[1]) for x in cur]
        channels[value[1]] = c
    return channels
