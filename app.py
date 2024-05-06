import json
import sqlite3
from flask import Flask , request, abort

app = Flask(__name__)

@app.route('/telemetry', methods=['GET'])
def telemetry():
    required_params = ['Operating_system', 'Memory', 'CPU', 'VTK_configuration', 'Qt_configuration', 'Internationalization', 'Developer_mode']
    data = {}
    for param in required_params:
        if param not in request.args:
            abort(400)  # Bad Request
        else:
            data[param] = request.args.get(param)

    with open('parameters.json', 'w') as f:
        json.dump(data, f)

    return 'OK', 200

if __name__ == '__main__':
    app.run()