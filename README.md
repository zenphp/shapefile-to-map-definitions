# Map builder scrips for simple_interactive_maps module

Makes use of shapefile and d3-geo-projection to convert US Census county shapefiles to
geojson format.  The geojson is then broken up into individual state definitions, and
are processed using d3-geo-projection which scales and performs a map projection process
on the geojson to generate an SVG path element definition.  This path element is then
used, along with the geographic metadata in the geojson to generate pre-built templates
for the US State and Territory county level maps.

## Detailed Description

This process has been derived from https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c

Download the county shape file from https://www2.census.gov/geo/tiger/GENZ2022/shp/cb_2022_us_county_5m.zip
and unzip.

Make use of shapefile to convert the shapefile data into a large geojson definition:

`shp2json cb_2023_us_county_5m.shp -o counties.json`

Build the cli script `node esbuild.config.js` and then run the result using `node dist/bundle.js`.
This will parse the counties.json file and generate a single geojson feed for each state and
territory in `./data/states`.  These individual feeds will then be parsed, and the geometry data
will be passed through a map projection function to normalize it.  The resulting geometry will then
be converted to an SVG path.  The complete list of county data for a state is then used to generate
the drupal module plugins for the Simple Interactive Maps module, generating all the MapDefinition
plugins that are provided as a part of the module distribution.
