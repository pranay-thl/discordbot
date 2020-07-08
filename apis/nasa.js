const axios = require('axios');
const moment = require('moment');
const ROVER_URL = "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos";

const CAMERAS = {
    "FHAZ" : "Front Hazard Avoidance Camera",
    "RHAZ" : "Rear Hazard Avoidance Camera",
    "MAST" : "Mast Camera",
    "CHEMCAM" : "Chemistry and Camera Complex",
    "MAHLI" : "Mars Hand Lens Imager",
    "MARDI" : "Mars Descent Imager",
    "NAVCAM" : "Navigation Camera"
}

async function fetchImage(date=moment().format("YYYY-MM-DD"), camera = "random") {
    if(camera === "random") {
        camera = Object.keys(CAMERAS)[Math.floor(Math.random() * 7)].toLowerCase();
    }
    if(date === "today") {
        date = moment().format("YYYY-MM-DD");
    }
    else if(date === "yesterday") {
        date = moment().subtract(1, 'days').format("YYYY-MM-DD");
    }
    else{
        if(!moment(date).isValid()) {
            date = moment().format("YYYY-MM-DD");
        }
    }
    try{
        var nasa_res = await axios.get(ROVER_URL,{
            params : {
                api_key : process.env.NASA,
                camera  : camera,
                earth_date : date
            }
        });
        var photo_arr = [];
        if(nasa_res.data && nasa_res.data.photos) {
            photo_arr = nasa_res.data.photos;
        }
        let res_data = photo_arr[Math.floor(Math.random() * photo_arr.length)].img_src;
        return {data: res_data};
    }
    catch(err) {
        return {error : err}
    }
}

module.exports = {
    fetchImage
}