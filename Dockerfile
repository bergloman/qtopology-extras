FROM node:10.14.1

# Setup the working directory
RUN mkdir /srv
WORKDIR /srv
RUN git clone https://github.com/bergloman/qtopology.git
RUN cd qtopology
RUN npm run install
RUN npm run build

# Setup the working directory
RUN mkdir /srv/qtopology-extras
WORKDIR /srv/qtopology-extras

# Send over the dependency definitions to the container

COPY package.json ./
COPY package-lock.json ./

# Install the dependencies
RUN npm install

# Copy the whitelisted files
COPY . .

RUN npm run build
RUN npm run test
