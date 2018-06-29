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

"""Helper functions for querying data for the Environment and Infrastructure graphs"""

# pylint: disable=invalid-name
# pylint: disable=broad-except

import datetime
import pymysql

DATABASE_DB = 'ops'
DATABASE_USER = 'ops'

ONEMETRE_VAISALA = {
    'temperature': ('W1m', 'wexttemp', '#009DDC'),
    'relative_humidity': ('W1m', 'wexthumid', '#009DDC'),
    'wind_direction': ('W1m', 'wwinddir', '#009DDC'),
    'wind_speed': ('W1m', 'wwindspeed', '#009DDC'),
    'pressure': ('W1m', 'wpressure', '#009DDC'),
    'rain_intensity': ('W1m', 'wrainint', '#009DDC'),
    'accumulated_rain': ('W1m', 'wrain', '#009DDC'),
    'dew_point_delta': ('W1m', 'wdewdelta', '#009DDC')
}

ROOMALERT = {
    'internal_temp': ('W1m', 'winttemp', '#009DDC'),
    'internal_humidity': ('W1m', 'winthumid', '#009DDC'),
}

# NOTE: internal/rack probes connected backwards in hardware
NITES_ROOMALERT = {
    'rack_temperature': ('NITES', 'ninttemp', '#DE0D92'),
    'rack_humidity': ('NITES', 'ninthumid', '#DE0D92'),
}

GOTO_VAISALA = {
    'temperature': ('GOTO', 'gexttemp', '#22cc44'),
    'relative_humidity': ('GOTO', 'gexthumid', '#22cc44'),
    'wind_direction': ('GOTO', 'gwinddir', '#22cc44'),
    'wind_speed': ('GOTO', 'gwindspeed', '#22cc44'),
    'pressure': ('GOTO', 'gpressure', '#22cc44'),
    'rain_intensity': ('GOTO', 'grainint', '#22cc44'),
    'accumulated_rain': ('GOTO', 'grain', '#22cc44'),
    'dew_point_delta': ('GOTO', 'gdewdelta', '#22cc44')
}

GOTO_ROOMALERT = {
    'internal_temp': ('GOTO', 'ginttemp', '#22cc44'),
    'internal_humidity': ('GOTO', 'ginthumid', '#22cc44'),
    'dome2_internal_temp': ('RASA', 'rinttemp', '#FDE74C'),
    'dome2_internal_humidity': ('RASA', 'rinthumid', '#FDE74C'),
}

SUPERWASP = {
    'ext_temperature': ('SWASP', 'swtemp', '#F26430'),
    'ext_humidity': ('SWASP', 'swhumid', '#F26430'),
    'wind_speed': ('SWASP', 'swwindspeed', '#F26430'),
    'wind_direction': ('SWASP', 'swwinddir', '#F26430'),
    'sky_temp': ('SWASP', 'swskytemp', '#F26430'),
    'dew_point_delta': ('SWASP', 'swdewdelta', '#F26430'),
}

ONEMETRE_RAINDETECTOR = {
    'unsafe_boards': ('W1m', 'rdboards', '#009DDC')
}

ONEMETRE_UPS = {
    'main_ups_battery_remaining': ('W1m', 'mupsbat', '#009DDC'),
    'dome_ups_battery_remaining': ('NITES', 'dupsbat', '#DE0D92'),
}

RASA_UPS = {
    'ups_battery_remaining': ('RASA', 'rupsbat', '#FDE74C'),
}

GOTO_UPS = {
    'main_ups_battery_remaining': ('GOTO&nbsp;Main', 'goto-mupsbat', '#22CC44'),
    'dome_ups_battery_remaining': ('GOTO&nbsp;Dome', 'goto-dupsbat', '#22CC44'),
}

SUPERWASP_ROOFBATTERY = {
    'voltage': ('SWASP Roof Battery', 'swroofbat', '#F26430'),
}

NETWORK = {
    'ngtshead': ('Warwick', 'pingngts', '#FDE74C'),
    'google': ('Google', 'pinggoogle', '#009DDC'),
    'onemetre': ('1m', 'pingint1m', '#009DDC'),
    'goto': ('GOTO', 'pingintgoto', '#22CC44'),
    'nites': ('NITES', 'pingintnites', '#DE0D92'),
    'swasp': ('SWASP', 'pingintswasp', '#F26430'),
    'swasp_gateway': ('WHT', 'pingintwht', '#CC0000'),
}

def environment_json(date=None):
    """Queries the data to be rendered on the "Environment" dashboard page
       If date is specified, returns data for the specified night (UTC times: 12 through 12)
       If date is not specified, returns data for the last 6 hours.

       Returns a tuple of (<dictionary of flot-compatible series data>,
       <js timestamp for the series-start time>, <js timestamp for the series-end time>)
    """
    try:
        start = datetime.datetime.strptime(date, '%Y-%m-%d') \
            + datetime.timedelta(hours=11, minutes=54)
        end = start + datetime.timedelta(hours=24, minutes=12)
    except Exception:
        end = datetime.datetime.utcnow()
        start = end - datetime.timedelta(hours=6, minutes=6)

    start_str = start.isoformat()
    end_str = end.isoformat()
    start_js = int(start.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000)
    end_js = int(end.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000)

    db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER)
    data = __vaisala_json(db, 'weather_onemetre_vaisala', ONEMETRE_VAISALA, start_str, end_str)
    data.update(__sensor_json(db, 'weather_onemetre_roomalert', ROOMALERT, start_str, end_str))
    data.update(__superwasp_json(db, 'weather_superwasp', SUPERWASP, start_str, end_str))
    data.update(__sensor_json(db, 'weather_onemetre_raindetector', ONEMETRE_RAINDETECTOR, start_str,
                              end_str))
    data.update(__sensor_json(db, 'weather_nites_roomalert', NITES_ROOMALERT, start_str, end_str))
    data.update(__vaisala_json(db, 'weather_goto_vaisala', GOTO_VAISALA, start_str, end_str))
    data.update(__goto_roomalert_json(db, 'weather_goto_roomalert', GOTO_ROOMALERT, start_str, end_str))
    db.close()

    return data, start_js, end_js

def infrastructure_json(date=None):
    """Queries the data to be rendered on the "Infrastructure" dashboard page
       If date is specified, returns data for the specified full day (UTC times)
       If date is not specified, returns data for the last 6 hours.

       Returns a tuple of (<dictionary of flot-compatible series data>,
       <js timestamp for the series-start time>, <js timestamp for the series-end time>)
    """
    try:
        start = datetime.datetime.strptime(date, '%Y-%m-%d') - datetime.timedelta(minutes=6)
        end = start + datetime.timedelta(hours=24, minutes=6)
    except Exception:
        end = datetime.datetime.utcnow()
        start = end - datetime.timedelta(hours=6, minutes=6)

    start_str = start.isoformat()
    end_str = end.isoformat()
    start_js = int(start.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000)
    end_js = int(end.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000)

    db = pymysql.connect(db=DATABASE_DB, user=DATABASE_USER)
    data = __sensor_json(db, 'weather_onemetre_ups', ONEMETRE_UPS, start_str, end_str)
    data.update(__sensor_json(db, 'weather_rasa_ups', RASA_UPS, start_str, end_str))
    data.update(__sensor_json(db, 'weather_goto_ups', GOTO_UPS, start_str, end_str))
    data.update(__ping_json(db, 'weather_network', NETWORK, start_str, end_str))
    data.update(__sensor_json(db, 'weather_superwasp_roofbattery', SUPERWASP_ROOFBATTERY, start_str,
                              end_str))
    db.close()

    return data, start_js, end_js

def __query_table(db, query, valid_filter=None):
    """Queries data for a plot series from the database, optionally applying a valid data filter"""
    with db.cursor() as cur:
        cur.execute(query)

        # Times are enumerated in reverse order
        next_time = None
        c = {}
        c['data'] = []
        c['max'] = c['min'] = 0
        for x in cur:
            time = x[0].replace(tzinfo=datetime.timezone.utc).timestamp() * 1000

            c['max'] = max(c['max'], x[1])
            c['min'] = max(c['min'], x[1])

            # Insert a break in the plot line if there is > 6 minutes between points
            if next_time is not None and next_time - time > 360000:
                c['data'].append(None)

            if valid_filter and not valid_filter(time, x[1]):
                c['data'].append(None)
            else:
                c['data'].append((int(time), x[1]))
            next_time = time
        return c

def __sensor_json(db, table, channels, start, end):
    """Queries data for an general-case sensor"""
    data = {}

    for key in channels:
        value = channels[key]
        c = {'label': value[0], 'color': value[2]}

        query = 'SELECT `date`, `' + key + '` from `' + table + '` WHERE ' \
            + '`date` > ' + db.escape(start) + ' AND `date` <= ' \
            + db.escape(end) + ' ORDER BY `date` DESC;'

        c.update(__query_table(db, query))
        data[value[1]] = c
    return data

def __goto_roomalert_json(db, table, channels, start, end):
    """Hacky workaround for additional dome sensor added 2018-06-29"""
    data = {}

    for key in channels:
        value = channels[key]
        c = {'label': value[0], 'color': value[2]}

        query = 'SELECT `date`, `' + key + '` from `' + table + '` WHERE ' \
            + '`date` > ' + db.escape(start) + ' AND `date` <= ' \
            + db.escape(end)

        if key.startswith('dome2_'):
            query += ' AND `bin` > 262172'

        query += ' ORDER BY `date` DESC;'
        c.update(__query_table(db, query))
        data[value[1]] = c
    return data

def __superwasp_json(db, table, channels, start, end):
    """Hacky workaround for bogus SuperWASP wind speed measurements"""
    data = {}

    for key in channels:
        value = channels[key]
        c = {'label': value[0], 'color': value[2]}

        query = 'SELECT `date`, `' + key + '` from `' + table + '` WHERE ' \
            + '`date` > ' + db.escape(start) + ' AND `date` <= ' \
            + db.escape(end)

        if key in ['wind_speed', 'wind_direction']:
            query += ' AND  `wind_speed` <= 180'

        query += ' ORDER BY `date` DESC;'

        c.update(__query_table(db, query))
        data[value[1]] = c
    return data


def __ping_json(db, table, channels, start, end):
    """Queries data for the network ping graph, applying the -1 = invalid point filter"""
    data = {}

    for key in channels:
        value = channels[key]
        c = {'label': value[0], 'color': value[2]}

        query = 'SELECT `date`, `' + key + '` from `' + table + '` WHERE ' \
            + '`date` > ' + db.escape(start) + ' AND `date` <= ' \
            + db.escape(end) + ' ORDER BY `date` DESC;'

        c.update(__query_table(db, query, lambda time, ping: ping >= 0))
        data[value[1]] = c
    return data

def __vaisala_json(db, table, channels, start, end):
    """Queries data for the vaisala graphs, applying the _valid == 0 = invalid point filter"""
    data = {}
    for key in channels:
        value = channels[key]
        c = {'label': value[0], 'color': value[2]}

        query = 'SELECT `date`, `' + key + '` from `' + table + '` WHERE `' \
            + key + '_valid` = 1 AND `date` > ' + db.escape(start) + ' AND `date` <= ' \
            + db.escape(end) + ' ORDER BY `date` DESC;'

        c.update(__query_table(db, query))
        data[value[1]] = c
    return data
