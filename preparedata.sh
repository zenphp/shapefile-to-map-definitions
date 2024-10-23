#!/bin/bash

# Enable error handling
set -e

# Define the base URL for the Census Bureau shape files
baseURL="https://www2.census.gov/geo/tiger/GENZ2023/shp"

# Define the directory to store the downloaded data
dataDir="data"


countyDataDir="$dataDir/county"

# Create the data directory if it does not exist
if [ ! -d "$dataDir" ]; then
    mkdir -p "$dataDir"
fi

# Create the county data directory if it does not exist
if [ ! -d "$countyDataDir" ]; then
    mkdir -p "$countyDataDir"
fi

if [ ! -f "$dataDir/cb_2023_us_county_5m.zip" ]; then
    echo "Downloading the Census Bureau shape files..."
    # Download the Census Bureau shape files
    curl -o "$dataDir/cb_2023_us_county_5m.zip" "$baseURL/cb_2023_us_county_5m.zip"
else
    echo "Census Bureau shape files already downloaded."
fi

# Unzip the shape files to the same directory
unzip -o "$dataDir/cb_2023_us_county_5m.zip" -d "$countyDataDir"

npx shp2json ${countyDataDir}/cb_2023_us_county_5m.shp -o ${countyDataDir}/counties.json


schoolDataDir="$dataDir/schools"

# Create the school data directory if it does not exist
if [ ! -d "$schoolDataDir" ]; then
    mkdir -p "$schoolDataDir"
fi

if [ ! -f "$dataDir/cb_2023_us_unsd_5m.zip" ]; then
    echo "Downloading the Census Bureau shape files..."
    curl -o "$dataDir/cb_2023_us_unsd_500k.zip" "$baseURL/cb_2023_us_unsd_500k.zip"
else
    echo "Census Bureau shape files already downloaded."
fi

# Unzip the shape files to the same directory
unzip -o "$dataDir/cb_2023_us_unsd_500k.zip" -d "$schoolDataDir"

npx shp2json ${schoolDataDir}/cb_2023_us_unsd_500k.shp -o ${schoolDataDir}/schools.json


congressionalDataDir="$dataDir/congressional_districts"

# Create the school data directory if it does not exist
if [ ! -d "$congressionalDataDir" ]; then
    mkdir -p "$congressionalDataDir"
fi

if [ ! -f "$dataDir/cb_2023_us_cd118_500k.zip" ]; then
    echo "Downloading the Census Bureau shape files..."
    curl -o "$dataDir/cb_2023_us_cd118_500k.zip" "$baseURL/cb_2023_us_cd118_500k.zip"
else
    echo "Census Bureau shape files already downloaded."
fi

# Unzip the shape files to the same directory
unzip -o "$dataDir/cb_2023_us_cd118_500k.zip" -d "$congressionalDataDir"

npx shp2json ${congressionalDataDir}/cb_2023_us_cd118_500k.shp -o ${congressionalDataDir}/congressional_districts.json
