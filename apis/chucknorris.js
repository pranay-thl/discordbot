const axios = require('axios');
const CHUCKNORRIS_URL = "https://api.chucknorris.io/jokes/random";

async function fetchJoke() {
    try {
        var chuck_res = await axios.get(CHUCKNORRIS_URL);
        return { data: chuck_res.data.value };
    }
    catch (err) {
        return { error: err }
    }
}

module.exports = {
    fetchJoke
}