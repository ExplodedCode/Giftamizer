FROM node:12

# Create app directory
WORKDIR /usr/src/app/

# Copy all files into image
COPY . ./

# install packages and build
RUN npm install express cors body-parser http socket.io monk
# RUN npm run build

EXPOSE 8080
CMD [ "npm", "start" ]