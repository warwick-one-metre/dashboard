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

CHANNELS = {
    'temperature': ('1m Outside Temperature', 'vexttemp'),
    'relative_humidity': ('1m Outside Humidity', 'vexthumid'),
    'wind_direction': ('1m Wind Direction', 'vwinddir'),
    'wind_speed': ('1m Wind Speed', 'vwindspeed'),
    'pressure': ('1m Air Pressure', 'vpressure'),
    'accumulated_rain': ('1m Accumulated Rain', 'vrain'),
    'dew_point_delta': ('1m Dew Pt. Delta', 'vdewdelta')
}

def plot_json(start=None, end=None):
    try:
        start_str = start.isoformat()
    except:
        start_str = (datetime.datetime.utcnow() - datetime.timedelta(hours=12)).isoformat()

    try:
        end_str = end.isoformat()
    except:
        end_str = datetime.datetime.utcnow().isoformat()

    channels = {}
    db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER)
    for key in CHANNELS:
        value = CHANNELS[key]
        c = {'title': value[0]}

        with db.cursor() as cur:
            query = 'SELECT `date`, `' + key + '` from `weather_onemetre_vaisala` WHERE `' \
                + key + '_valid` = 1 AND `date` > ' + db.escape(start_str) + ' AND `date` <= ' \
                + db.escape(end_str) + ' ORDER BY `date` DESC LIMIT 250;'
            cur.execute(query)
            c['data'] = list([(int(x[0].timestamp() * 1000), x[1]) for x in cur])

        channels[value[1]] = c
    return channels
