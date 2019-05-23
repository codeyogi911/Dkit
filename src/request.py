# USAGE
# python simple_request.py

# import the necessary packages
import requests
import time
import glob
# from os import walk
# f=[]
# for (dirpath, dirnames, filenames) in walk("../datasets/IKEA_FIXA/val/"):
#     f.extend(filenames)
#     break 
# initialize the Keras REST API endpoint URL along with the input
# image path
KERAS_REST_API_URL = "http://localhost:5000/detect"
IMAGE_PATHS = glob.glob("../datasets/IKEA_FIXA/val/*.jpeg")
IMAGE_PATHS.extend(glob.glob("../datasets/IKEA_FIXA/val/*.jpg"))
# for filename in f:
# 	path = "../datasets/IKEA_FIXA/val/" + filename
# 	IMAGE_PATHS.append(path)
# IMAGE_PATH = "../datasets/IKEA_FIXA/val/Image.jpeg"

for path in IMAGE_PATHS:
	print("Trying {}".format(path))
	# load the input image and construct the payload for the request
	image = open(path, "rb").read()
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