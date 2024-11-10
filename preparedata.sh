#!/bin/bash

# Enable error handling
set -e


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
    curl -o "$dataDir/cb_2023_us_county_5m.zip" "https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_5m.zip"
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
    curl -o "$dataDir/cb_2023_us_unsd_500k.zip" "https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_unsd_500k.zip"
else
    echo "Census Bureau shape files already downloaded."
fi

# Unzip the shape files to the same directory
unzip -o "$dataDir/cb_2023_us_unsd_500k.zip" -d "$schoolDataDir"

npx shp2json ${schoolDataDir}/cb_2023_us_unsd_500k.shp -o ${schoolDataDir}/schools.json


congressionalDataDir="$dataDir/congressional_districts"

# Create the school data directory if it does not exist
if [ ! -d "$congressionalDataDir" ]; then
    mkdir -p "$congressionalDataDir/118"
    mkdir -p "$congressionalDataDir/119"
fi

if [ ! -f "$dataDir/cb_2023_us_cd118_500k.zip" ]; then
    echo "Downloading the Census Bureau shape files..."
    curl -o "$dataDir/cb_2023_us_cd118_500k.zip" "https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_cd118_500k.zip"

else
    echo "Census Bureau shape files already downloaded."
fi

# Unzip the shape files to the same directory
unzip -o "$dataDir/cb_2023_us_cd118_500k.zip" -d "$congressionalDataDir/118"

npx shp2json ${congressionalDataDir}/118/cb_2023_us_cd118_500k.shp -o ${congressionalDataDir}/118/congressional_districts.json

# Download the 2024 119th Congressional Districts shape files
# These are tigerl line files and only individual state files are available

for i in {1..78}; do
    # Skip 3,7,14, 43, 52, 57-59, 61-65, 67, 68, 70, 71, 73-77
    if [ $i -eq 3 ] || [ $i -eq 7 ] || [ $i -eq 14 ] || [ $i -eq 43 ] || [ $i -eq 52 ] || [ $i -ge 57 ] && [ $i -le 59 ] || [ $i -ge 61 ] && [ $i -le 65 ] || [ $i -eq 67 ] || [ $i -eq 68 ] || [ $i -eq 70 ] || [ $i -eq 71 ] || [ $i -ge 73 ] && [ $i -le 77 ]; then
        continue
    fi

    ## if i is less than 10, add a leading 0
    if [ $i -lt 10 ]; then
        i="0$i"
    fi

    # Download the 2024 119th Congressional Districts shape files only if they do not exist in the data directory
    if [ ! -f "$dataDir/tl_2024_${i}_cd119.zip" ]; then
        echo "Downloading the 2024 119th Congressional Districts shape files for state $i..."
        curl -o "$dataDir/tl_2024_${i}_cd119.zip" "https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_${i}_cd119.zip"
    else
        echo "2024 119th Congressional Districts shape files for state $i already downloaded."
    fi

    mkdir -p "${congressionalDataDir}/119/${i}"
    unzip -o "$dataDir/tl_2024_${i}_cd119.zip" -d "$congressionalDataDir/119/${i}"
    npx shp2json ${congressionalDataDir}/119/${i}/tl_2024_${i}_cd119.shp -o ${congressionalDataDir}/119/${i}/congressional_districts_${i}.json
done

