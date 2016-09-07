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

from flask import abort
from flask import Flask
from flask import jsonify
from flask import render_template
from flask import request

app = Flask(__name__)

@app.route('/onemetre/')
def onemetre_dashboard():
    return render_template('onemetre/dashboard.html')

@app.route('/onemetre/current/')
def onemetre_current():
    return render_template('onemetre/current.html')

@app.route('/onemetre/dome/')
def onemetre_dome():
    return render_template('onemetre/dome.html')

@app.route('/nites/dome/')
def nites_dome():
    return render_template('nites/dome.html')

@app.route('/extcams/')
def extcams():
    return render_template('extcams.html')

@app.route('/skycams/')
def skycams():
    return render_template('skycams.html')

@app.route('/resources/')
def resources():
    return render_template('resources.html')
