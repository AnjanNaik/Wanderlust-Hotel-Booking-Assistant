const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

require("dotenv").config();
const dbUrl = process.env.ATLASDB_URL || process.env.MONGO_URL;

main()
.then(() => {
    console.log("Connected to DB");
})
.catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

const initDB = async () => {
    await Listing.deleteMany({});

    const ownerId = "69b13b3503745c0375611ead";

    const newData = initdata.data.map((obj) => ({
        ...obj,
        owner: ownerId,
        image: { url: obj.image.url || obj.image, filename: obj.image.filename || "listingimage" }
    }));

    await Listing.insertMany(newData);

    console.log("Data was initialized");
};

initDB();
