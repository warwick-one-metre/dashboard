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
}

GOTO_DOME2_INTERNAL = {
    'temperature': ('RASA', 'rinttemp', '#FDE74C'),
    'relative_humidity': ('RASA', 'rinthumid', '#FDE74C')
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

SUPERWASP_UPS = {
    'ups1_battery_remaining': ('SWASP&nbsp;UPS1', 'swasp-ups1bat', '#F26430'),
    'ups2_battery_remaining': ('SWASP&nbsp;UPS2', 'swasp-ups2bat', '#F26430'),
    'roofbattery': ('SWASP Roof Battery', 'swroofbat', '#F26430'),
}

SUPERWASP_ROOMALERT = {
    'comp_room_temp': ('SWComp', 'swcomptemp', '#F26430'),
    'comp_room_humidity': ('SWComp', 'swcomphumid', '#F26430'),
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

EUMETSAT_OPACITY = {
    'opacity': ('EUMETSAT', 'eumetsat', '#F26430'),
}

TNG_SEEING = {
    'seeing': ('TNG', 'tngseeing', '#F26430')
}

ROBODIMM_SEEING = {
    'seeing': ('RoboDIMM', 'roboseeing', '#FDE74C')
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
    data = __vaisala_json(db, 'weather_onemetre_vaisala', ONEMETRE_VAISALA, 'wwindrange', start_str, end_str,
                          wind_range_offset=-30000)
    data.update(__sensor_json(db, 'weather_onemetre_roomalert', ROOMALERT, start_str, end_str))
    data.update(__superwasp_json(db, 'weather_superwasp', SUPERWASP, start_str, end_str))
    data.update(__sensor_json(db, 'weather_onemetre_raindetector', ONEMETRE_RAINDETECTOR, start_str,
                              end_str))
    data.update(__sensor_json(db, 'weather_nites_roomalert', NITES_ROOMALERT, start_str, end_str))
    data.update(__vaisala_json(db, 'weather_goto_vaisala', GOTO_VAISALA, 'gwindrange', start_str, end_str,
                               wind_range_offset=30000))
    data.update(__sensor_json(db, 'weather_goto_roomalert', GOTO_ROOMALERT, start_str, end_str))
    data.update(__vaisala_json(db, 'weather_goto_dome2_internal', GOTO_DOME2_INTERNAL, None, start_str, end_str))
    data.update(__sensor_json(db, 'weather_superwasp_roomalert', SUPERWASP_ROOMALERT, start_str, end_str))
    data.update(__sensor_json(db, 'weather_eumetsat_opacity', EUMETSAT_OPACITY,
                              start_str, end_str, 1200))
    data.update(__sensor_json(db, 'weather_tng_seeing', TNG_SEEING, start_str, end_str))
    data.update(__sensor_json(db, 'weather_robodimm_seeing', ROBODIMM_SEEING, start_str, end_str))

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
    data.update(__sensor_json(db, 'weather_superwasp_ups', SUPERWASP_UPS, start_str, end_str))
    data.update(__ping_json(db, 'weather_network', NETWORK, start_str, end_str))
    db.close()

    return data, start_js, end_js


def __query_weather_data(db, table, columns, start, end):
    """Query columns from a weather database table.
       Results are returned as a dictionary keyed by columns + date
       with values as arrays of data between start and end
    """
    query = 'SELECT `date`, `' + '`, `'.join(columns) \
        + '` from `' + table + '` WHERE `date` > ' + db.escape(start) \
        + ' AND `date` <= ' + db.escape(end) + ' ORDER BY `date` DESC;'

    results = {
        'date': []
    }

    for c in columns:
        results[c] = []

    with db.cursor() as cur:
        cur.execute(query)
        for r in cur:
            results['date'].append(r[0])
            for i, column in enumerate(columns):
                results[column].append(r[i + 1])

    return results


def __generate_plot_data(label, color, date, series, data_break=360):
    """Creates a plot data object suitable for plotting via javascript using flot.
       date and series should be given in reverse chronological order
       Lines are broken if there is a gap more than data_break seconds between points
    """
    c = {
        'label': label,
        'color': color,
        'data': [],
        'max': 0,
        'min': 0
    }

    next_ts = None
    for x, y in zip(date, series):
        ts = x.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000
        c['max'] = max(c['max'], y)
        c['min'] = max(c['min'], y)

        # Insert a break in the plot line if there is a break between points
        if next_ts is not None and next_ts - ts > data_break * 1000:
            c['data'].append(None)

        c['data'].append((int(ts), y))
        next_ts = ts

    return c


def __sensor_json(db, table, channels, start, end, data_break=360):
    """Queries data for an general-case sensor"""
    results = __query_weather_data(db, table, list(channels.keys()), start, end)
    data = {}
    for key in channels:
        label, name, color = channels[key]
        data[name] = __generate_plot_data(label, color, results['date'], results[key],
                                          data_break=data_break)

    return data


def __superwasp_json(db, table, channels, start, end):
    """Hacky workaround for bogus SuperWASP wind speed measurements"""
    results = __query_weather_data(db, table, list(channels.keys()), start, end)

    # Filter bogus wind measurements
    wind_date = []
    wind_speed = []
    wind_direction = []
    for date, speed, direction in zip(results['date'],
                                      results['wind_speed'],
                                      results['wind_direction']):
        if speed < 200:
            wind_date.append(date)
            wind_speed.append(speed)
            wind_direction.append(direction)

    data = {}
    for key in channels:
        label, name, color = channels[key]
        if key == 'wind_speed':
            data[name] = __generate_plot_data(label, color, wind_date, wind_speed)
        elif key == 'wind_direction':
            data[name] = __generate_plot_data(label, color, wind_date, wind_direction)
        else:
            data[name] = __generate_plot_data(label, color, results['date'], results[key])

    return data


def __ping_json(db, table, channels, start, end):
    """Queries data for the network ping graph, applying the -1 = invalid point filter"""
    results = __query_weather_data(db, table, list(channels.keys()), start, end)
    data = {}
    for key in channels:
        label, name, color = channels[key]

        date = []
        filtered = []
        for d, value in zip(results['date'], results[key]):
            if value > 0:
                date.append(d)
                filtered.append(value)

        data[name] = __generate_plot_data(label, color, date, filtered)

    return data


def __vaisala_json(db, table, channels, wind_range_key, start, end, wind_range_offset=0):
    """Queries data for the vaisala graphs, applying the _valid == 0 = invalid point filter"""
    columns = list(channels.keys()) + [c + '_valid' for c in channels]
    if wind_range_key and 'wind_speed' in columns:
        columns += ['wind_gust', 'wind_gust_valid', 'wind_lull', 'wind_lull_valid']

    results = __query_weather_data(db, table, columns, start, end)

    data = {}
    for key in channels:
        label, name, color = channels[key]

        date = []
        filtered = []
        for d, value, valid in zip(results['date'], results[key], results[key + '_valid']):
            if valid:
                date.append(d)
                filtered.append(value)

        data[name] = __generate_plot_data(label, color, date, filtered)

    if wind_range_key and 'wind_gust' in columns:
        minmax_data = []
        min_lull = None
        max_gust = 0

        for i in range(len(results['wind_gust'])):
            if not results['wind_gust_valid'][i] or not results['wind_lull_valid'][i]:
                continue

            ts = results['date'][i].replace(tzinfo=datetime.timezone.utc).timestamp() * 1000

            mid = (results['wind_gust'][i] + results['wind_lull'][i]) / 2
            delta = (results['wind_gust'][i] - results['wind_lull'][i]) / 2

            if min_lull is None:
                min_lull = results['wind_lull'][i]
            else:
                min_lull = min(min_lull, results['wind_lull'][i])

            if max_gust is None:
                max_gust = results['wind_gust'][i]
            else:
                max_gust = max(max_gust, results['wind_gust'][i])

            minmax_data.append((int(ts) + wind_range_offset, mid, delta))

        data[wind_range_key] = {
            'label': '',
            'color': channels['wind_speed'][2],
            'points': {
                'radius': 0,
                'errorbars': 'y',
                'yerr': {'show': True},
            },
            'data': minmax_data,
            'max': max_gust,
            'min': min_lull
        }

    return data
