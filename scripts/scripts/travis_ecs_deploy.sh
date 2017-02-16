#! /bin/bash

if [ "$TRAVIS_BRANCH" == "develop" ]
then
    ENVIRONMENT=Dev
fi
if [ "$TRAVIS_BRANCH" == "master" ]
then
    ENVIRONMENT=Stage
fi

CLUSTER=U235$ENVIRONMENT
SERVICE=$TASK_DEFINITION$ENVIRONMENT

# get aws ecr url
REMOTE_IMAGE_URL=$(aws ecr describe-repositories --repository-names=${IMAGE_NAME} | jq -r '.repositories[].repositoryUri | tostring')

# This is needed to login on AWS and push the image on ECR
# Change it accordingly to your docker repo
#
# get docker repo login command and execute
eval $(aws ecr get-login --region $AWS_DEFAULT_REGION)

# Pre-sign a URL for downloading an ssh key that has access to github private repos
# The ssh key is mounted into the container during the `docker build` step and used
# by npm to install private dependencies in the package.json
aws s3 presign s3://travis-ci-keys/prod_dev_ci_user_id_rsa --expires-in 600 > ./pre_signed_ssh_key_url
docker build -t $IMAGE_NAME --build-arg BUILD_ENV=production .

echo "Pushing $IMAGE_NAME:$TRAVIS_BUILD_NUMBER"
docker tag $IMAGE_NAME:latest "$REMOTE_IMAGE_URL:$TRAVIS_BUILD_NUMBER"
docker push "$REMOTE_IMAGE_URL:$TRAVIS_BUILD_NUMBER"
docker tag $IMAGE_NAME:latest "$REMOTE_IMAGE_URL:latest"
docker push "$REMOTE_IMAGE_URL:latest"
echo "Pushed $IMAGE_NAME:$TRAVIS_BUILD_NUMBER"

# deploy task to cluster
echo "Deploying $TRAVIS_BRANCH on $TASK_DEFINITION"
./scripts/ecs_deploy.sh -t 600 -c $CLUSTER -n $SERVICE -i $REMOTE_IMAGE_URL:$TRAVIS_BUILD_NUMBER
