aws s3 sync ../datasets s3://dkitdatasets && \
docker-machine start dkit-trainer
docker-machine ssh dkit-trainer << EOF
cd Dkit && \
git pull && \
aws s3 sync s3://dkitdatasets datasets/ && \
source activate tensorflow_p36 && \
cd src && \
$bash start-tensorboard.sh
python3 dkit.py train --dataset=../datasets/IKEA_FIXA --weights=coco && \
var=\$(find ../logs -type f -name "mask_rcnn_dkit_0030.h5" | sort -r | head -n 1) && \
aws s3 cp "\$var" s3://dkitmodels-sg/mask_rcnn_dkit_coco_latest.h5 && \
exit
EOF
docker-machine stop dkit-trainer
aws s3 sync s3://dkitmodels-sg ../models