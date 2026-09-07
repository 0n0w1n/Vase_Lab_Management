FROM mysql:26

EXPOSE 3306

COPY test.sql /tmp/test.sql
CMD ["mysqld", "--init-file=/tmp/test.sql"]