FROM mhart/alpine-node:12

# Create app directory
WORKDIR /usr/src/app/

# Copy all files into image
COPY . ./

# install packages
RUN npm install

# create react build
RUN npm run build

ENV IS_DOCKER_CONTAINER yes

EXPOSE 8080
CMD [ "npm", "start" ]