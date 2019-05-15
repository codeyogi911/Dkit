docker-machine ssh dkit-trainer -L localhost:5000:dkit-trainer:5000 << EOF
cd Dkit && \
source activate tensorflow_p36 && \
aws s3 sync s3://dkitmodels-sg ../models && \
python3 serve.py
EOF