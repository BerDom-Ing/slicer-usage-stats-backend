import json
import json
import urllib.parse

def transform_string_to_url_query(input_string):
    # Split the string into lines
    lines = input_string.split('\n')

    json_dict = {}
    for line in lines:
        # Split the line into two parts
        parts = line.split(':')

        # Remove right padding of "." and spaces from the first part
        key = parts[0].rstrip('. ').rstrip()

        # Remove leading spaces from the second part
        value = parts[1].lstrip()

        # Replace spaces in key and value with "_"
        key = key.replace(' ', '_')
        value = value.replace(' ', '_')

        # Add the key-value pair to the dictionary
        json_dict[key] = value

    # Convert the dictionary to a URL query string
    url_query = urllib.parse.urlencode(json_dict)

    return url_query

# Test the function
input_string = """Operating system .........: Windows /  Personal / (Build 22631, Code Page 65001) - 64-bit
Memory ...................: 32344 MB physical, 34392 MB virtual
CPU ......................: GenuineIntel , 16 cores, 16 logical processors
VTK configuration ........: OpenGL2 rendering, TBB threading
Qt configuration .........: version 5.15.2, with SSL, requested OpenGL 3.2 (compatibility profile)
Internationalization .....: disabled, language=
Developer mode ...........: enabled"""
print(transform_string_to_url_query(input_string))