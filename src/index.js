#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const geo = require('d3-geo');
const geoProject = require('d3-geo-projection');

// Helper function to convert string to PascalCase
function toPascalCase(inputString) {
    return inputString
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

function convertPolygonToSvgPath(geometry) {
    let svgPathData = "";

    // Helper function to process rings
    function processRings(rings) {
        let pathData = "";
        rings.forEach((ring) => {
            pathData += `M ${ring[0][0]} ${ring[0][1]} `;
            for (let i = 1; i < ring.length; i++) {
                pathData += `L ${ring[i][0]} ${ring[i][1]} `;
            }
            pathData += "Z ";
        });
        return pathData;
    }

    // Check if the geometry is a Polygon or MultiPolygon
    if (geometry.type === 'Polygon') {
        svgPathData += processRings(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygon) => {
            svgPathData += processRings(polygon);
        });
    } else {
        console.log(geometry);
        throw new Error("The geometry must be a Polygon or MultiPolygon");
    }

    return svgPathData;
}

console.log('Starting...');

console.log('Loading counties data...');
// Load the counties data from ../data/counties.json
const counties = require('../data/counties.json');

const states = [];

console.log('Processing counties data into states...');
counties.features.forEach(county => {
    const state = county.properties.STATE_NAME;
    // if states[state] does not exist, create it
    if (!states[state]) {
        console.log('Adding state:', state);
        states[state] = {
            type: "FeatureCollection",
            features: []
        }
    }
    console.log('Adding county:', county.properties.NAME, 'to state:', state);
    states[state].features.push(county);
});

console.log('Writing state data to files...');
// Iterate over states
Object.keys(states).forEach(state => {
    console.log('Writing state data for:', state);
    const stateData = states[state];
    const outputDir = './data/states';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    fs.writeFileSync(path.join(outputDir, `${state}-counties.json`), JSON.stringify(stateData));
});

console.log('Creating PHP files...');
Object.keys(states).forEach(stateKey => {
    console.log('Processing state:', stateKey);
    const state = states[stateKey];
    console.log('Projecting state data...');
    // Apply projection to each state
    let projection;

    switch (stateKey) {
        case 'Alaska':
            // Alaska is a special case, mercator projection does not work well.
            projection = geo.geoAlbersUsa().fitSize([4800, 3000], state);
            break;
        default:
            projection = geo.geoMercator().fitSize([4800, 3000], state);
            break
    }

    const countyData = [];

    console.log('Processing counties data...');
    // Iterate over features
    state.features.forEach(county => {
        const countyName = county.properties.NAME;
        const countyId = county.properties.STUSPS + '-' + county.properties.GEOID;
        const countyPolygon = county.geometry;

        console.log('Processing county:', countyName, 'with id:', countyId);

        if (countyPolygon) {
            const svgPathData = geo.geoPath().projection(projection)(countyPolygon) ;

            countyData.push({
                label: countyName,
                id: countyId,
                path: svgPathData,
            });
        }
    });

    const templatePath = path.resolve(__dirname, 'templates/map_def.hbs');
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(source);

    const map_id = stateKey.replace(/\s/g, '_').toLowerCase() + '_counties';
    const class_name = toPascalCase(stateKey) + "Map";
    const map_name = stateKey + ' Counties';
    const map_description = 'A map of ' + stateKey + ' counties';
    const currentTimestamp = new Date().toISOString();

    const data = {
        map_id: map_id,
        map_class_name: class_name,
        map_name: map_name,
        map_description: map_description,
        counties: countyData,
        timestamp: currentTimestamp,
    };

    const outputDir = './out';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const result = template(data);
    fs.writeFileSync(path.join(outputDir, `${class_name}.php`), result);
});


console.log('PHP files created successfully.');
