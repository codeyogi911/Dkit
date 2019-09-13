docker-machine start dkit-detector
docker-machine ssh dkit-detector -L localhost:5000:localhost:5000 << EOF
cd Dkit/src && \
source activate tensorflow_p36 && \
aws s3 sync s3://dkitmodels-sg ../models
python3 serve.py
EOF
# cd /tmp/tfserving
# docker run --runtime=nvidia -p 8501:8501 --mount type=bind,\
# source=/tmp/tfserving/serving/tensorflow_serving/servables/tensorflow/testdata/saved_model_half_plus_two_gpu,\
# target=/models/half_plus_two -e MODEL_NAME=half_plus_two -t tensorflow/serving:latest-gpu