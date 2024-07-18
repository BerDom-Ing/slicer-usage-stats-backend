import json
import os
from flask import Flask, request, abort

app = Flask(__name__)

@app.route('/telemetry', methods=['GET'])
def telemetry():
    # Assuming data is received as a query parameter and needs to be processed
    data = request.args.get('data')
    if not data:
        abort(400, "No data provided")

    # Convert data from string to dictionary or list
    try:
        data_parsed = json.loads(data)
    except json.JSONDecodeError:
        abort(400, "Invalid JSON format")

    # Ensure data_parsed is a list
    if not isinstance(data_parsed, list):
        data_parsed = [data_parsed]

    # Define the path to the JSON file
    json_file_path = 'data.json'

    # Read existing data from the file, if it exists
    if os.path.exists(json_file_path) and os.path.getsize(json_file_path) > 0:
        with open(json_file_path, 'r') as file:
            try:
                existing_data = json.load(file)
                # Ensure existing_data is a list
                if not isinstance(existing_data, list):
                    existing_data = [existing_data]
            except json.JSONDecodeError:
                existing_data = []
    else:
        existing_data = []

    # Extend existing data with new data
    existing_data.extend(data_parsed)

    # Write the updated data back to the file
    with open(json_file_path, 'w') as file:
        json.dump(existing_data, file, indent=4)

    return 'OK'

@app.route('/')
def home():
    # Load and display the data from data.json
    try:
        with open('data.json', 'r') as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []

    # For simplicity, returning data as a string. Consider using render_template for HTML.
    return str(data)

if __name__ == '__main__':
    app.run(debug=True)