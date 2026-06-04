#!/bin/bash

echo "Pull latest code..."
git pull origin main

echo "Install dependencies..."
npm install

echo "Restart application..."
pm2 restart datn-backend

echo "Done!"
