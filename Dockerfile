FROM node:10.14.1

# Setup the working directory
RUN mkdir /srv/github-actions-app
WORKDIR /srv/github-actions-app

# Clone custom qtopology version
RUN git clone https://github.com/bergloman/qtopology.git
RUN cd qtopology && npm install && npm run build && cd ..

# Send over the dependency definitions to the container
RUN mkdir qtopology-extras
RUN cd qtopology-extras
COPY package.json ./qtopology-extras/
COPY package-lock.json ./qtopology-extras/

# Install the dependencies
RUN cd qtopology-extras && npm install

# Copy the whitelisted files
COPY . ./qtopology-extras/

RUN cd qtopology-extras && npm run build
RUN cd qtopology-extras && npm run test
