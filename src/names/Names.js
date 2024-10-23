class Names {
    static getNameFromData(data) {
        if (!data || !data.properties) {
            return undefined; // or some default value or error handling
        }

        // Check if the data.properties.NAME exists and return it
        if (data.properties.NAME) {
            return data.properties.NAME;
        }

        if (data.properties.NAMELSAD) {
            return data.properties.NAMELSAD;
        }

        return undefined; // or some default value if neither is found
    }
}

module.exports = Names;
