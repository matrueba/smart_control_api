FROM node:16.13.1

WORKDIR /usr/app

COPY . /usr/app

RUN npm install

ENV MQTT_PORT=1883
ENV TOKEN="abcdefg"
ENV MQTT_HOST="192.168.0.10"

CMD ["npm", "start"]