const fs = require('fs');
const folder = "./images/";


function getImgLocation (imageName) {

    fs.access((folder + imageName), fs.F_OK, (err) => {
        if (err) {
            return folder + "default.png";
        } else {
            return folder + imageName;
        }
    });
    
}

module.exports.getImgLocation = getImgLocation();