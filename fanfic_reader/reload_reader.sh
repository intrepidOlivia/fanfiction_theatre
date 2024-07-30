# git pull

# Copy certs into working context
cp /etc/letsencrypt/live/fanfictiontheatre.com/privkey.pem .
cp /etc/letsencrypt/live/fanfictiontheatre.com/cert.pem .

docker build -t fanfic_reader .
docker stop fanfic_reader
docker rm fanfic_reader
docker run -d -p 8080:8080 --name fanfic_reader fanfic_reader

rm privkey.pem
rm cert.pem
