import json
import sqlite3
from flask import Flask , request, abort, render_template
from sqlite3 import Error

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

    # Connect to the SQLite database (it will be created if it doesn't exist)
    try:
        conn = sqlite3.connect('telemetry.db')
        c = conn.cursor()

        # Create the table if it doesn't exist
        c.execute('''
            CREATE TABLE IF NOT EXISTS telemetry (
                Operating_system TEXT,
                Memory TEXT,
                CPU TEXT,
                VTK_configuration TEXT,
                Qt_configuration TEXT,
                Internationalization TEXT,
                Developer_mode TEXT
            )
        ''')

        # Insert the data into the table
        c.execute('''
            INSERT INTO telemetry VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (data['Operating_system'], data['Memory'], data['CPU'], data['VTK_configuration'], data['Qt_configuration'], data['Internationalization'], data['Developer_mode']))

        # Commit the changes and close the connection
        conn.commit()
    except Error as e:
        print(f"The error '{e}' occurred.")
        return 'Error', 500
    finally:
        if conn:
            conn.close()
    return 'OK', 200

@app.route('/')
def home():
    conn = sqlite3.connect('telemetry.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM telemetry")
    data = cursor.fetchall()
    conn.close()
    return render_template('index.html', data=data)

if __name__ == '__main__':
    app.run()