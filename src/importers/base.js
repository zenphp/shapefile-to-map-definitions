class ImporterBase {
    toPascalCase(inputString) {
        return inputString
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    convertPolygonToSvgPath(geometry) {
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
}

module.exports = ImporterBase;
