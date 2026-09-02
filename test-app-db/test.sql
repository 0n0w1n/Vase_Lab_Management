drop database if exists Test;
create database Test;
use Test;

create table Users (
  Username varchar(100) primary key,
  FirstName varchar(100),
  LastName varchar(100)
);

insert into Users values ("admin", "John", "Admin");
insert into Users values ("awsfgdj", "John", "NotAdmin");