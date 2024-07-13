git pull
docker build -t fanfic_reader .
docker stop fanfic_reader
docker rm fanfic_reader
docker run -d -p 8080:8080 --name fanfic_reader fanfic_reader