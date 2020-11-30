FROM node:12

# Create app directory
WORKDIR /usr/src/app/

# Copy all files into image
COPY . ./

# install packages and build
RUN npm install
RUN npm run build

EXPOSE 8080
CMD [ "npm", "start" ]