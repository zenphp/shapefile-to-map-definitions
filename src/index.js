#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const geo = require('d3-geo');
const geoProject = require('d3-geo-projection');
const States = require('./states/States.js');
const Names = require('./names/Names.js');
const Ids = require('./ids/Ids.js');

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

const sources = [
    {
        name: 'counties',
        input: '../data/county/counties.json',
        rawOutputDir: './data/county/raw',
        template: 'templates/map_def.hbs',
        outputDir: './out/counties',
        name_attribute: 'STATE_NAME',
    },
    {
        name: 'schools',
        input: '../data/schools/schools.json',
        rawOutputDir: './data/schools/raw',
        template: 'templates/map_def_uscd.hbs',
        outputDir: './out/schools',
    },
    {
        name: 'congressional_districts',
        input: '../data/congressional_districts/congressional_districts.json',
        rawOutputDir: './data/congressional_districts/raw',
        template: 'templates/map_def_congressional_districts.hbs',
        outputDir: './out/congressional_districts',
    },
]

console.log('Starting...');

sources.forEach(source => {

    console.log(`Loading ${source.name} data...`);
    // Load the counties data from ../data/counties.json
    const sourceData = require(source.input);

    const states = [];

    console.log('Processing counties data into states...');
    sourceData.features.forEach(item => {
        const state = States.getStateFromData(item);
        // if states[state] does not exist, create it
        if (!states[state]) {
            console.log('Adding state:', state);
            states[state] = {
                type: "FeatureCollection",
                features: []
            }
        }
        const itemName = Names.getNameFromData(item);
        console.log(`Adding ${itemName} to state: ${state}`);
        states[state].features.push(item);
    });

    console.log('Writing state data to files...');
    // Iterate over states
    Object.keys(states).forEach(state => {
        console.log('Writing state data for:', state);
        const stateData = states[state];
        const outputDir = source.rawOutputDir;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        fs.writeFileSync(path.join(outputDir, `${state}-${source.name}.json`), JSON.stringify(stateData));
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

        const tempateData = [];

        console.log(`Processing data...`);
        // Iterate over features
        state.features.forEach(item => {
            const itemName = Names.getNameFromData(item);
            const itemId = Ids.getIdFromData(item);
            const itemPolygon = item.geometry;

            console.log(`Processing ${source.name}:`, itemName, 'with id:', itemId);

            if (itemPolygon) {
                const svgPathData = geo.geoPath().projection(projection)(itemPolygon);

                tempateData.push({
                    label: itemName,
                    id: itemId,
                    path: svgPathData,
                });
            }
        });

        const templatePath = path.resolve(__dirname, source.template);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(templateSource);

        const map_id = stateKey.replace(/\s/g, '_').toLowerCase() + '_' + source.name;

        // convert source.name from snake_case to PascalCase
        const sourceName = source.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        const class_name = toPascalCase(stateKey) + sourceName +  "Map";

        const humanName = source.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const map_name = stateKey + ' ' + humanName + ' Map';
        const map_description = 'A map of ' + stateKey + ' ' + humanName + ' data';

        const currentTimestamp = new Date().toISOString();

        const data = {
            map_id: map_id,
            map_class_name: class_name,
            map_name: map_name,
            map_description: map_description,
            items: tempateData,
            timestamp: currentTimestamp,
        };

        const outputDir = source.outputDir;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const result = template(data);
        fs.writeFileSync(path.join(outputDir, `${class_name}.php`), result);
    });
});


// console.log('Loading school district data...');
// const schools = require('../data/schools/schools.json');

// states = [];

// console.log('Processing schools data into states...');
// schools.features.forEach(school => {
//     const state = school.properties.STATE_NAME;
//     // if states[state] does not exist, create it
//     if (!states[state]) {
//         console.log('Adding state:', state);
//         states[state] = {
//             type: "FeatureCollection",
//             features: []
//         }
//     }
//     console.log(school.properties);
//     console.log('Adding school:', school.properties.NAME, 'to state:', state);
//     states[state].features.push(school);
// });

// console.log('Writing state data to files...');
// // Iterate over states
// Object.keys(states).forEach(state => {
//     console.log('Writing state data for:', state);
//     const stateData = states[state];
//     const outputDir = './data/schools/raw';
//     if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir);
//     }
//     fs.writeFileSync(path.join(outputDir, `${state}-ucsd.json`), JSON.stringify(stateData));
// });

// console.log('Creating PHP files...');
// Object.keys(states).forEach(stateKey => {
//     console.log('Processing state:', stateKey);
//     const state = states[stateKey];
//     console.log('Projecting state data...');
//     // Apply projection to each state
//     let projection;

//     switch (stateKey) {
//         case 'Alaska':
//             // Alaska is a special case, mercator projection does not work well.
//             projection = geo.geoAlbersUsa().fitSize([4800, 3000], state);
//             break;
//         default:
//             projection = geo.geoMercator().fitSize([4800, 3000], state);
//             break
//     }

//     const schoolData = [];

//     console.log('Processing school data...');
//     // Iterate over features
//     state.features.forEach(school => {
//         const schoolName = school.properties.NAME;
//         const schoolId = school.properties.STUSPS + '-' + school.properties.GEOID;
//         const schoolPolygon = school.geometry;

//         console.log('Processing county:', schoolName, 'with id:', schoolId);

//         if (schoolPolygon) {
//             const svgPathData = geo.geoPath().projection(projection)(schoolPolygon);

//             schoolData.push({
//                 label: schoolName,
//                 id: schoolId,
//                 path: svgPathData,
//             });
//         }
//     });

//     const templatePath = path.resolve(__dirname, 'templates/map_def_uscd.hbs');
//     const source = fs.readFileSync(templatePath, 'utf8');
//     const template = Handlebars.compile(source);

//     const map_id = stateKey.replace(/\s/g, '_').toLowerCase() + '_usd';
//     const class_name = toPascalCase(stateKey) + "Map";
//     const map_name = stateKey + ' Unified School Districts';
//     const map_description = 'A map of ' + stateKey + ' Unified School Districts';
//     const currentTimestamp = new Date().toISOString();

//     const data = {
//         map_id: map_id,
//         map_class_name: class_name,
//         map_name: map_name,
//         map_description: map_description,
//         districts: schoolData,
//         timestamp: currentTimestamp,
//     };

//     const outputDir = './out/schools';
//     if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir);
//     }

//     const result = template(data);
//     fs.writeFileSync(path.join(outputDir, `${class_name}.php`), result);
// });



console.log('PHP files created successfully.');
