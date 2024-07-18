# Telemetry test server

## Prerequisites

This project requires Nginx. Follow the instructions below to install and configure Nginx.

### Installing Nginx

go to https://nginx.org/en/download.html and downlad lastest the file.

### Setting up Nginx

Go to the folder where you have nginx and paste de conf folder in the repo into the nginx folder to replace the nginx.conf file.

### Starting the test

start nginx double clicking the nginx file
run app.py 
The server is now running you can submit data from the SendTelemetryInfo extension.

### After doing the test

You should see that a file named data.json in the folder of the program, to view its content go to http://127.0.0.1/