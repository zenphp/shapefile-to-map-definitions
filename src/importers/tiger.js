const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const geo = require('d3-geo');
const geoProject = require('d3-geo-projection');
const States = require('../states/States.js');
const Names = require('../names/Names.js');
const Ids = require('../ids/Ids.js');
const BaseImporter = require('./base.js');

class TigerImporter extends BaseImporter {
    import(source) {
        console.log(`Loading ${source.name} data...`);
        const states = [];

        Object.keys(States.FIPS).forEach((fips) => {
            const state = States.FIPS[fips];
            const sourceName = source.input_base + `/${fips}/congressional_districts_${fips}.json`;
            const sourceData = require(sourceName)
            console.log('Processing congressional districts data into states...');
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
        });

        console.log('Writing state data to files...');
        // Iterate over states
        Object.keys(states).forEach(state => {
            console.log('Writing state data for:', state);
            const stateData = states[state];
            const outputDir = source.rawOutputDir;
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
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
                    projection = geo.geoAlbers().fitSize([4800, 3000], state);
                    break;
            }

            const templateData = [];

            console.log(`Processing data...`);
            state.features.forEach((feature) => {
                const id = Ids.getIdFromData(feature);
                const name = Names.getNameFromData(feature);
                const svgPathData = geo.geoPath().projection(projection)(feature);

                templateData.push({
                    id: id,
                    label: name,
                    path: svgPathData,
                });
            });

            console.log('Writing PHP files...');


            const templatePath = path.join(__dirname, source.template);
            const templateSource = fs.readFileSync(templatePath, 'utf8');
            const template = Handlebars.compile(templateSource);

            const map_id = stateKey.replace(/\s/g, '_').toLowerCase() + '_' + source.name;

            // convert source.name from snake_case to PascalCase
            const sourceName = source.class_name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
            const class_name = this.toPascalCase(stateKey) + sourceName + "Map";

            const humanName = source.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const map_name = stateKey + ' ' + humanName + ' Map';
            const map_description = 'A map of ' + stateKey + ' ' + humanName + ' data';

            const currentTimestamp = new Date().toISOString();

            const data = {
                map_id: map_id,
                map_class_name: class_name,
                map_name: map_name,
                map_description: map_description,
                items: templateData,
                timestamp: currentTimestamp,
                category: source.category,
            };

            const outputDir = source.outputDir;
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const result = template(data);
            fs.writeFileSync(path.join(outputDir, `${class_name}.php`), result);
        });
    }
}

module.exports = TigerImporter;
