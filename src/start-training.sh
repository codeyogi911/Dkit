aws s3 sync ../datasets s3://dkitdatasets && \
docker-machine start dkit-trainer
docker-machine ssh dkit-trainer -L localhost:6006:dkit-trainer:6006 << EOF
cd Dkit && \
rm -r datasets/ && \
aws s3 sync s3://dkitdatasets datasets/ && \
source activate tensorflow_p36 && \
tensorboard --logdir logs/ & \
source activate tensorflow_p36 && \
cd Dkit/src && python3 dkit.py train --dataset=../datasets/IKEA_FIXA --weights=coco && \
cd ../logs/ && cd $(ls -td -- */ | head -n 1) && aws s3 cp mask_rcnn_dkit_0030.h5 s3://dkitmodels-sg/mask_rcnn_dkit_coco_latest.h5
EOF
docker-machine stop dkit-trainer
aws s3 sync s3://dkitmodels-sg ../models