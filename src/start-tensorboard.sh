docker-machine ssh dkit-trainer -L localhost:6006:dkit-trainer:6006 << EOF
cd Dkit && \
source activate tensorflow_p36 && \
tensorboard --logdir logs/
EOF