import os
import sys
import PIL
from PIL import Image
# Root directory of the project
ROOT_DIR = os.path.abspath(".")
print ("Root is:" + ROOT_DIR)
sys.path.append(ROOT_DIR)
import glob
filenames_train = glob.glob1("utilities/anno/","*.png___fuse.png")
print(len(filenames_train))
for name in filenames_train:
    full_filepath = ROOT_DIR + "/utilities/anno/" + name
    print("Opening : " + full_filepath)
    image = Image.open(full_filepath)
    image_converted = image.convert("P")
    print("New mode is : " + image_converted.mode)
    save_filepath = ROOT_DIR + "/utilities/outputs/masks/" + name.replace(".png___fuse","")
    print("Saving as : "+ save_filepath+"\n\n")
    image_converted.save(save_filepath)