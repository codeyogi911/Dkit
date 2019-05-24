# USAGE
# python simple_request.py

# import the necessary packages
import os
import sys
# Root directory of the project
ROOT_DIR = os.path.abspath(".")
sys.path.append(ROOT_DIR)
import requests
import time
import glob
from mrcnn import utils
from keras.preprocessing.image import img_to_array
from src import dkit
from PIL import Image
import io
import cv2

# from os import walk
# f=[]
# for (dirpath, dirnames, filenames) in walk("../datasets/IKEA_FIXA/val/"):
#     f.extend(filenames)
#     break 
# initialize the Keras REST API endpoint URL along with the input
# image path
KERAS_REST_API_URL = "http://localhost:5000/detect"
IMAGE_PATHS = glob.glob("datasets/IKEA_FIXA/scaled/*.jpeg")
IMAGE_PATHS.extend(glob.glob("datasets/IKEA_FIXA/scaled/*.jpg"))
config = dkit.DkitConfig()
class InferenceConfig(config.__class__):
    # Run detection on one image at a time
    GPU_COUNT = 1
    IMAGES_PER_GPU = 1
    USE_MINI_MASK = False

config = InferenceConfig()
# config.display()
# for filename in f:
# 	path = "../datasets/IKEA_FIXA/val/" + filename
# 	IMAGE_PATHS.append(path)
# IMAGE_PATH = "../datasets/IKEA_FIXA/val/Image.jpeg"
def prepare_image(image, target):
    # if the image mode is not RGB, convert it
    # if image.mode != "RGB":
        # image = image.convert("RGB")
    image = img_to_array(image)
    # resize the input image and preprocess it
    image, window, scale, padding, crop = utils.resize_image(
        image,
        min_dim=config.IMAGE_MIN_DIM,
        min_scale=config.IMAGE_MIN_SCALE,
        max_dim=config.IMAGE_MAX_DIM,
        mode=config.IMAGE_RESIZE_MODE)
    
    # image = np.expand_dims(image, axis=0)
    # image = imagenet_utils.preprocess_input(image)

    # return the processed image
    return image

for path in IMAGE_PATHS:
	print("Trying {}".format(path))
	start = time.time()
	# load the input image and construct the payload for the request
	# image = open(path, "rb").read()
	print("Preparing Image...")
	# image = Image.open(io.BytesIO(image))
	# image = Image.open(path)
	# image = prepare_image(image, target=(1024, 1024))
	payload = {"image": open(path, 'rb')}
	end = time.time()
	print("Ready to send Image... Time : {}".format(end-start))
	# submit the request
	r = requests.post(KERAS_REST_API_URL,files=payload).json()
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