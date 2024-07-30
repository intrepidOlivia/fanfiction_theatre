FROM node

WORKDIR ~

COPY . .

RUN npm install

COPY privkey.pem /etc/letsencrypt/live/fanfictiontheatre.com/
COPY cert.pem /etc/letsencrypt/live/fanfictiontheatre.com/

EXPOSE 8080

CMD ["npm", "start"]

# Keeps the docker container open even if a script is not running
# CMD ["tail", "-f", "/dev/null"]
