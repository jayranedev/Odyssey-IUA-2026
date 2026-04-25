import requests
import json
import base64

def send_request(prompt=None, index=None):
    if prompt is None:
        prompt = "Pipe ka size check karo: Apne ghar ke nal (tap) ka size dekho. Zyada tar Indian ghar mein 1/2 inch ya 3/4 inch ka tap hota hai. Agar 3/4 inch hai to female adapter bhi wahi size lao. Pipe ko haath se tap ke paas rakho — gap estimate karo."
    if index is None:
        index = 1

    # Matching the exact nested payload structure
    payload = [[["q4uTj", json.dumps([None, json.dumps({"instances": [{"prompt": prompt}], "parameters": {"sampleCount": 1}}), 2]), None, "generic"]]]

    url = 'https://gemini.google.com/_/BardChatUi/data/batchexecute'

    headers = {
        'Cookie': 'NID=530%3DmVT...', # Replace with your actual full cookie
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    try:
        # BatchExecute usually expects the payload in a 'f.req' form field
        data = {'f.req': json.dumps(payload)}

        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()

        # Cleaning the prefix )]}'
        clean_text = response.text.replace(")]}'", "").strip()
        outer_data = json.loads(clean_text)

        # Flattening to find the string containing the base64 data
        # We look for the item that contains "bytesBase64Encoded"
        def find_target(data_list):
            for item in data_list:
                if isinstance(item, list):
                    res = find_target(item)
                    if res: return res
                elif isinstance(item, str) and "bytesBase64Encoded" in item:
                    return item
            return None

        target_string = find_target(outer_data)

        if target_string:
            final_object = json.loads(target_string)

            # Handling the nested string/list logic from your original code
            if isinstance(final_object, list):
                final_object = json.loads(final_object[0])

            base64_data = final_object['predictions'][0]['bytesBase64Encoded']

            # Writing the image file
            with open(f"image{index}.png", "wb") as fh:
                fh.write(base64.b64decode(base64_data))

            print(f"Successfully saved image{index}.png")
            return base64_data

    except Exception as e:
        print(f"Request failed: {e}")

    return None

if __name__ == "__main__":
    send_request()
