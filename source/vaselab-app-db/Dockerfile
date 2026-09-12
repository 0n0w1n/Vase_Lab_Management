FROM mysql:26

EXPOSE 3306

COPY VaseLab.sql /tmp/VaseLab.sql
CMD ["mysqld", "--init-file=/tmp/VaseLab.sql"]