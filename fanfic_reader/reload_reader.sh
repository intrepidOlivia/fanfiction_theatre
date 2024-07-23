git pull
docker build -t fanfic_reader .
docker stop fanfic_reader
docker rm fanfic_reader
docker run -v /etc/letsencrypt/live/fanfictiontheatre.com:/etc/letsencrypt/live/fanfictiontheatre.com:ro -d -p 8080:8080 --name fanfic_reader fanfic_reader
