#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const geo = require('d3-geo');
const geoProject = require('d3-geo-projection');

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


// Load the counties data from ../data/counties.json
const counties = require('../data/counties-albers.json');

// Initialize the countyData object
const countyData = {};

// Set up the projection and path generator
const projection = geo.geoAlbersUsa().fitSize([9600, 6000], counties);

const projectedData = geoProject.geoProject(counties, projection);

const outputDir = './data';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

fs.writeFileSync(path.join(outputDir, 'counties-proj-albers.json'), JSON.stringify(projectedData));


// Iterate over counties.features
projectedData.features.forEach(county => {
    const countyName = county.properties.NAME;
    const countyId = county.properties.STUSPS + '-' + county.properties.GEOID;
    const countyPolygon = county.geometry;
    const state = county.properties.STATE_NAME;

    if (countyPolygon) {
        const svgPathData = convertPolygonToSvgPath(countyPolygon);

        // Ensure the state key exists in the countyData object
        if (!countyData[state]) {
            countyData[state] = [];
        }

        countyData[state].push({
            name: countyName,
            id: countyId,
            path: svgPathData
        });
    }
});

// iterate over each state in the countyData object
Object.keys(countyData).forEach(state => {
    console.log(`State: ${state}`);

    const outputDir = './data/states';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    fs.writeFileSync(path.join(outputDir, `${state}-counties.json`), JSON.stringify(countyData[state]));
});

// Helper function to convert string to PascalCase
function toPascalCase(inputString) {
    return inputString
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

// Iterate over each state in the countyData object
Object.keys(countyData).forEach(state => {
    // Load the state template
    const templatePath = path.resolve(__dirname, 'templates/map_def.hbs');
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(source);

    const map_id = state.replace(/\s/g, '_').toLowerCase() + '_counties';
    const class_name = toPascalCase(state) + "Map";
    const map_name = state + ' Counties';
    const map_description = 'A map of ' + state + ' counties';

    const counties = countyData[state].map(county => ({
        label: county.name,
        id: county.id,
        path: county.path
    }));

    const data = {
        map_id: map_id,
        map_class_name: class_name,
        map_name: map_name,
        map_description: map_description,
        counties: counties
    };

    // Ensure that the output directory exists
    const outputDir = './out';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const result = template(data);
    fs.writeFileSync(path.join(outputDir, `${class_name}.php`), result);
});

console.log('PHP files created successfully.');
