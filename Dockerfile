FROM ubuntu:16.04
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
ADD . /u235core
ARG BUILD_ENV=development

#RUN chmod +x /u235core/scripts/docker-entrypoint.sh

# install required packages
RUN apt-get -qq -y update && apt-get -qq -y install wget ruby2.3 g++ build-essential curl python git

# install npm and node
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs

# install node packages
WORKDIR /u235core

# if the BUILD_ENV has been specified to something other than
# 'development' install modules from npm expecting a pre-signed URL to the
# key stored in AWS to have been generated before the Dockerfile is run
RUN if [ "$BUILD_ENV" != "development" ]; then \
      rm -rf node_modules && \
      mkdir ~/.ssh && \
      eval "$(ssh-agent -s)" && \
      wget -i /u235core/pre_signed_ssh_key_url -q -O - > ~/.ssh/id_rsa && \
      chmod 600 ~/.ssh/id_rsa && \
      ssh-add ~/.ssh/id_rsa && \
      ssh -o StrictHostKeyChecking=no git@github.com || true && \
      npm install --production && \
      rm -rf ~/.ssh/* /u235core/pre_signed_ssh_key_url; \
    fi

EXPOSE 80

#ENTRYPOINT ["/u235core/scripts/docker-entrypoint.sh"]

# run migrations and start app
CMD ["/usr/bin/npm run db:migrate:test && /usr/bin/npm start"]
