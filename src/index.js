#!/usr/bin/env node

const GenZImporter = require('./importers/genz.js');
const TigerImporter = require('./importers/tiger.js');

const sources = [
    {
        name: 'counties',
        class_name: 'Counties',
        importer: 'genz',
        input: '../data/county/counties.json',
        rawOutputDir: './data/county/raw',
        template: 'templates/map_def.hbs',
        outputDir: './out/counties',
        name_attribute: 'STATE_NAME',
        category: 'US Census Bureau County Maps'
    },
    {
        name: 'schools',
        class_name: 'Schools',
        importer: 'genz',
        input: '../data/schools/schools.json',
        rawOutputDir: './data/schools/raw',
        template: 'templates/map_def_uscd.hbs',
        outputDir: './out/schools',
        category: 'US Census Bureau Unified School District Maps'
    },
    {
        name: 'congressional_districts_118',
        class_name: 'CongressionalDistricts',
        importer: 'genz',
        input: '../data/congressional_districts/118/congressional_districts.json',
        rawOutputDir: './data/congressional_districts/118/raw',
        template: 'templates/map_def_congressional_districts.hbs',
        outputDir: './out/congressional_districts/118',
        category: 'US Census Bureau 118th Congressional District Maps'
    },
    {
        name: 'congressional_districts_119',
        class_name: 'CongressionalDistricts',
        importer: 'tiger',
        input_base: '../data/congressional_districts/119',
        rawOutputDir: './data/congressional_districts/raw',
        template: 'templates/map_def_congressional_districts.hbs',
        outputDir: './out/congressional_districts/119',
        category: 'US Census Bureau 119th Congressional District Maps'
    }
]

console.log('Starting...');

sources.forEach(source => {

    switch (source.importer) {
        case 'genz':
            const genz = new GenZImporter();
            genz.import(source);
            break;

        case 'tiger':
            const tiger = new TigerImporter();
            tiger.import(source);
            break;

    }
});
