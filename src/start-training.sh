aws s3 sync ../datasets s3://dkitdatasets && \
docker-machine start dkit-trainer
docker-machine ssh dkit-trainer -L localhost:6006:dkit-trainer:6006 << EOF
cd Dkit && \
aws s3 sync s3://dkitdatasets datasets/ && \
source activate tensorflow_p36 && \
tensorboard --logdir logs/ & \
cd src && python3 dkit.py train --dataset=../datasets/IKEA_FIXA --weights=coco && \
cd .. && aws s3 sync logs/ s3://dkitmodels-sg 
EOF
docker-machine stop dkit-trainer && \
aws s3 sync s3://dkitmodels-sg ../logs/