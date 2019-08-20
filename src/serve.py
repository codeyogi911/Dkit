import os
ROOT_DIR = os.path.abspath(".")
import sys
# Root directory of the project

sys.path.append(ROOT_DIR)
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
from keras.applications import imagenet_utils
import numpy as np
from keras.preprocessing.image import img_to_array
import io
from PIL import Image
from mrcnn import utils
from src import dkit
import base64
import mrcnn.model as modellib
import tensorflow as tf
from flask import Flask
import flask


#Custom imports
from flask_cors import CORS
# import h5py
# h5py.run_tests()




app = Flask(__name__)
CORS(app)
model = None
graph = None

config = dkit.DkitConfig()
    # Override the training configurations with a few
    # changes for inferencing.


class InferenceConfig(config.__class__):
    # Run detection on one image at a time
    GPU_COUNT = 1
    IMAGES_PER_GPU = 1
    USE_MINI_MASK = False


config = InferenceConfig()
config.display()

MODEL_DIR = os.path.join(ROOT_DIR, "logs")
DEVICE = "/gpu:0"


def load_model():
    global model

    # Create model in inference mode
    with tf.device(DEVICE):
        model = modellib.MaskRCNN(mode="inference", model_dir=MODEL_DIR,
                              config=config)
    weights_path = "../models/mask_rcnn_dkit_coco_latest.h5"
    # Load weights
    print("Loading weights ", weights_path)
    model.load_weights(weights_path, by_name=True)
    global graph
    graph = tf.get_default_graph()


def prepare_image(image, target):
    # if the image mode is not RGB, convert it
    if image.mode != "RGB":
        image = image.convert("RGB")
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


@app.route('/detect', methods=["POST"])
def detect():
    # initialize the data dictionary that will be returned from the
    # view
    data = {"success": False}

    # ensure an image was properly uploaded to our endpoint
    if flask.request.method == "POST":
        # if flask.request.files.get("image"):
        image = flask.request.files['file']
        
        # starter = file.find(',')
        # image_data = file[starter+1:]
        # image_data = bytes(image_data, encoding="ascii")
        # image = Image.open(io.BytesIO(base64.b64decode(image_data)))
            # print(image)
            # image = Image.open(io.BytesIO(image))

            # preprocess the image and prepare it for classification
            # image = prepare_image(image, target=(1024, 1024))

            # classify the input image and then initialize the list
            # of detections to return to the client
        print(img_to_array(Image.open(image).convert('RGB')).shape)
        with graph.as_default():
            results = model.detect(
                [img_to_array(Image.open(image).convert('RGB'))], verbose=1)
        data["detections"] = []

            # loop over the results and add them to the list of
            # returned detections
            # for class_id in results[0]["class_ids"]:
            #     r = {"class_ids": class_id}
        data["detections"] = results[0]["class_ids"].tolist()
            # app.logger.debug(results[0]["class_ids"])
            # data["detections"] = results[0]["class_ids"]
            # indicate that the request was a success
        data["success"] = True

    # return the data dictionary as a JSON response
    return flask.jsonify(data)

# if this is the main thread of execution first load the model and
# then start the server
if __name__ == "__main__":
    print(("* Loading Dkit model and Flask starting server..."
        "please wait until server has fully started"))
    load_model()
    app.run()
