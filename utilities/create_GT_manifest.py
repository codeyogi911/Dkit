import glob
import json
import os
IMAGE_PATHS = glob.glob("datasets/IKEA_FIXA/scaled/*.jpeg")
IMAGE_PATHS.extend(glob.glob("datasets/IKEA_FIXA/scaled/*.jpg"))
for path in IMAGE_PATHS:
    data = {}
    data['source-ref'] = "s3://bit-groundtruth/images/" + \
        os.path.basename(path)
    # print("Trying {}".format(path))
    # print(os.path.basename(path))
    with open('utilities/manifest.json', 'a') as outfile:
        outfile.write(json.dumps(data)+"\n")
        # json.dump(data, outfile)
 