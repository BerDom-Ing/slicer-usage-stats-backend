import json
import json
import urllib.parse

def transform_string_to_url_query(input_string):
    # Split the string into lines
    lines = input_string.split(',')

    json_dict = {}
    for line in lines:
        print(line)
        # split the line with only the first underscore
        module, function = line.split('_', 1)
        #delete from module string { and "
        module = module.replace('{', '')
        module = module.replace('"', '') 
        #split value with only the first colon
        function, timesCalled = function.split(':', 1)
        #delete from function string " 
        function = function.replace('"', '')
        #delete from timesCalled string }
        timesCalled = timesCalled.replace('}', '')
        #delete the space from the beginning of the string
        timesCalled = timesCalled.strip()
        module = module.strip()
        # print the value
        print(module)
        print(function)
        print(timesCalled)

    return json_dict

# Test the function
input_json = """{"BoneReconstructionPlanner_onGenerateFibulaPlanesTimerTimeout": 3, "MyFirstModule_sendFunctionCountToServer": 4, "MyFirstModule_send_function_count_to_server": 15}"""
transform_string_to_url_query(input_json)