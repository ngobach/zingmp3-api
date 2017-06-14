FROM node:latest
RUN mkdir /var/app
ADD . /var/app
WORKDIR /var/app
RUN npm install
EXPOSE 8080
CMD [ "node", "index.js" ]