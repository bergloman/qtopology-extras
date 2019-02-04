FROM node:10.14.1

# Setup the working directory
RUN mkdir /srv/github-actions-app
WORKDIR /srv/github-actions-app

# Clone custom qtopology version
RUN git clone https://github.com/bergloman/qtopology.git
RUN cd qtopology
RUN npm run install
RUN npm run build
RUN cd ..

# Send over the dependency definitions to the container
RUN mkdir qtopology-extras
RUN cd qtopology-extras
COPY package.json ./
COPY package-lock.json ./

# Install the dependencies
RUN npm install

# Copy the whitelisted files
COPY . .

RUN npm run build
RUN npm run test
