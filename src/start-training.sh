aws s3 sync s3://dkitdatasets /home/ubuntu/Dkit/datasets/
source activate tensorflow_p36
python3 dkit.py train --dataset=../datasets/IKEA_FIXA --weights=coco