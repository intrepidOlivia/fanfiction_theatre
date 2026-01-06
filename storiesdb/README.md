The database that stores information about each Fanfiction Theatre story is a Postgres database hosted in a Docker container.

The table is called `stories`. Its data is meant to be mapped to the `Story` class written in C# for use with the Streamerbot API.

The Javascript interface used to retrieve the data in the database is a JavaScript library called [node-postgres](https://node-postgres.com/).