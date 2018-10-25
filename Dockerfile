FROM node
RUN apt-get update \
&& apt-get install procps nano htop -y
EXPOSE 8080
WORKDIR /src/app
COPY package.json /src/app
COPY server.js /src/app
RUN npm install
CMD ["npm", "start"]

