# USAGE
# python simple_request.py

# import the necessary packages
import requests
import time

# initialize the Keras REST API endpoint URL along with the input
# image path
KERAS_REST_API_URL = "http://localhost:5000/detect"
IMAGE_PATH = "../datasets/IKEA_FIXA/val/Image.jpeg"


# load the input image and construct the payload for the request
image = open(IMAGE_PATH, "rb").read()
payload = {"image": image}
start = time.time()
# submit the request
r = requests.post(KERAS_REST_API_URL, files=payload).json()
end = time.time()
# ensure the request was sucessful
if r["success"]:
	print("Response: {} , Time: {}".format(r,end-start))
	# loop over the predictions and display them
	# for (i, result) in enumerate(r["detections"]):
	# 	print("{}. {}".format(i + 1, result["class_ids"]))

# otherwise, the request failed
else:
	print("Request failed")