#!/bin/sh

sudo sudo systemctl start mysql

sudo pm2 start npm --name backend -- start --prefix /home/pi/backend

sudo pm2 start npm --name frontend -- start --prefix /home/pi/frontend
