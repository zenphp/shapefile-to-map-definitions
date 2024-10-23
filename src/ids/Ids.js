class Ids {

    static getIdFromData(data) {
        if (!data || !data.properties) {
            return undefined; // or some default value or error handling
        }

        if (data.properties.STUSPS && data.properties.GEOID) {
            return data.properties.STUSPS + '-' + data.properties.GEOID;
        }

        if (data.properties.GEOID) {
            return data.properties.GEOID;
        }

        return undefined; // or some default value if neither is found
    }
}

module.exports = Ids;
