@echo off
setlocal enabledelayedexpansion

REM Define the base URL for the Census Bureau shape files
set baseURL=https://www2.census.gov/geo/tiger/GENZ2023/shp/

REM Define the directory to store the downloaded data
set dataDir=data

REM Create the data directory if it does not exist
if not exist %dataDir% (
    mkdir %dataDir%
)

REM List of FIPS codes for US states and territories
set FIPSList=01 02 04 05 06 08 09 10 11 12 13 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 44 45 46 47 48 49 50 51 53 54 55 56 72

REM Iterate over each FIPS code
for %%F in (%FIPSList%) do (
    REM Download the shape file zip for the current FIPS code
    set fileURL=%baseURL%s%%F%%_state.zip
    echo Downloading %%F from %fileURL%
    curl -o %dataDir%\s%%F%%_state.zip %fileURL%

    REM Unzip the downloaded file
    echo Unzipping s%%F%%_state.zip
    powershell -command "Expand-Archive -Path '%dataDir%\s%%F%%_state.zip' -DestinationPath '%dataDir%'"

    REM Remove the zip file after extraction
    del %dataDir%\s%%F%%_state.zip
)

echo All files downloaded and unzipped.
