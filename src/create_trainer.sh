if [ -d "../datasets" ]
then
    aws s3 sync ../datasets s3://dkitdatasets
else
    aws s3 sync s3://dkitdatasets ../datasets
fi
# aws s3 sync ../datasets s3://dkitdatasets && \
# Create new ec2 machine
docker-machine create --driver amazonec2 --amazonec2-iam-instance-profile ec2-trainer --amazonec2-ami ami-060865e8b5914b4c4 --amazonec2-root-size 150 --amazonec2-instance-type p3.2xlarge dkit-trainer && \
# Setup Dkit in the system
docker-machine ssh dkit-trainer << EOF
source activate tensorflow_p36 && git clone https://github.com/codeyogi911/Dkit.git && \
cd Dkit && pip3 install -r requirements.txt && \
python setup.py install && aws s3 sync s3://dkitdatasets datasets/
EOF