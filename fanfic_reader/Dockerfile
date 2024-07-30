FROM node

WORKDIR ~

# COPY package*.json ./

# RUN npm install

COPY . .

RUN npm install

COPY privkey.pem /etc/letsencrypt/live/fanfictiontheatre.com/
COPY cert.pem /etc/letsencrypt/live/fanfictiontheatre.com/

EXPOSE 8080

CMD ["npm", "start"]

# CMD ["tail", "-f", "/dev/null"]
