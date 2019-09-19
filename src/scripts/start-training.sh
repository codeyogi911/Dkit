#Variables
layers2train=$1

aws s3 sync ../../datasets s3://dkitdatasets && \
docker-machine start dkit-trainer
# bash start-tensorboard.sh
docker-machine ssh dkit-trainer << EOF
cd Dkit && \
git pull && \
aws s3 sync s3://dkitdatasets datasets/ --delete && \
source activate tensorflow_p36 && \
cd src && \
# python3 dkit.py train --dataset=../datasets/IKEA_FIXA --weights=last
python3 coco_trainer.py train --dataset=../datasets/ikea_drill_screw --weights=last --layers2train=$layers2train
var=\$(find ../logs -type f -name "mask_rcnn_cocosynth_dataset_0030.h5" | sort -r | head -n 1)
# aws s3 cp "\$var" s3://dkitmodels-sg/mask_rcnn_dkit_coco_latest.h5
aws s3 cp "\$var" s3://dkitmodels-sg/cocosynth/mask_rcnn_dkit_cocosynth_latest.h5
exit
EOF
docker-machine stop dkit-trainer
aws s3 sync s3://dkitmodels-sg ../models