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

go to your browser and try a URL with the correct parameters that will be logged in the nginx logs folder in access.log with 200 showing that everything went ok:
try this url: http://127.0.0.1/telemetry?Operating_system=Windows_%2F__Personal_%2F_%28Build_22631%2C_Code_Page_65001%29_-_64-bit&Memory=32344_MB_physical%2C_34392_MB_virtual&CPU=GenuineIntel_%2C_16_cores%2C_16_logical_processors&VTK_configuration=OpenGL2_rendering%2C_TBB_threading&Qt_configuration=version_5.15.2%2C_with_SSL%2C_requested_OpenGL_3.2_%28compatibility_profile%29&Internationalization=disabled%2C_language%3D&Developer_mode=enabled

to try an URL that has wrong parameters(it says only Operating instead of Operating_system) that should log a 400 showing that something went wrong try:
http://127.0.0.1/telemetry?Operating=Windows_%2F__Personal_%2F_%28Build_22631%2C_Code_Page_65001%29_-_64-bit&Memory=32344_MB_physical%2C_34392_MB_virtual&CPU=GenuineIntel_%2C_16_cores%2C_16_logical_processors&VTK_configuration=OpenGL2_rendering%2C_TBB_threading&Qt_configuration=version_5.15.2%2C_with_SSL%2C_requested_OpenGL_3.2_%28compatibility_profile%29&Internationalization=disabled%2C_language%3D&Developer_mode=enabled

### After doing the test

You should see that a file named telemetry.db in the folder of the program, to view its content go to http://127.0.0.1/