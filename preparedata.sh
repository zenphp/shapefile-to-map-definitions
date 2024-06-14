#!/bin/bash

# Enable error handling
set -e

# Define the base URL for the Census Bureau shape files
baseURL="https://www2.census.gov/geo/tiger/GENZ2023/shp"

# Define the directory to store the downloaded data
dataDir="data"

# Create the data directory if it does not exist
if [ ! -d "$dataDir" ]; then
    mkdir -p "$dataDir"
fi

# Download the Census Bureau shape files
curl -o "$dataDir/cb_2023_us_county_5m.zip" "$baseURL/cb_2023_us_county_5m.zip"

# Unzip the shape files to the same directory
unzip -o "$dataDir/cb_2023_us_county_5m.zip" -d "$dataDir"
