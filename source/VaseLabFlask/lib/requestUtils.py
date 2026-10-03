# please make sure it is actually needed in multiple places and not put here for the sake of it T_T

def verify_user_input(input_json, expected_keys):

    if input_json is None:
        return {"errorCode": "10", "error": "JSON unparseable"}, 400
    if type(input_json) != dict:
        return {"errorCode": "11", "error": "Not valid JSON"}, 400
    input_json: dict

    input_keys = input_json.keys()
    for i, expected_key in enumerate(expected_keys):
        if expected_key not in input_keys:
            return {"errorCode": f"2{i}", "error": f"Key '{expected_key}' not found"}, 400

    return {"errorCode": "0", "error": "None"}, 200