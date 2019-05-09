aws s3 sync ../datasets s3://dkitdatasets && \
docker-machine start dkit-trainer
docker-machine ssh dkit-trainer << EOF
cd Dkit && \
aws s3 sync s3://dkitdatasets datasets/ && \
source activate tensorflow_p36 && \
cd Dkit/src/ && python3 dkit.py train --dataset=../datasets/IKEA_FIXA --weights=coco && \
cd .. && aws s3 sync logs/ s3://dkitmodels 
EOF
docker-machine stop dkit-trainer
