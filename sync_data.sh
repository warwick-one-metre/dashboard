#!/bin/bash
while true; do
    rsync -avz gotoserver:/srv/dashboard/generated/* generated
    sleep 10
done
