const esbuild = require('esbuild');
const { copy } = require('esbuild-plugin-copy');

esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    platform: 'node',
    outdir: 'dist/',
    plugins: [
        copy({
            assets: {
                from: ['./src/templates/*.hbs'],
                to: ['./templates/'],
                keepStructure: true,
            },
        }),
    ],
}).catch(() => process.exit(1));
