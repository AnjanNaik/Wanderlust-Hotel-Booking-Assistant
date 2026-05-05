const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews");

const listingSchema = new Schema({
    title: {
        type:String,
        required:true,
    },
    description: String,
    image: {
        url:String,
        filename:String,
    },
    price: Number,
    location: String,
    country: String,
    category: {
        type: String,
        enum: ["Trending", "Rooms", "Iconic cities", "Mountains", "Castles", "Amazing pools", "Camping", "Farms", "Arctic", "Domes", "Boats", "Luxe", "Design", "Amazing views", "Lakefront", "National parks"],
        required: true
    },

    geometry: {
        type: {
            type: String, 
            enum: ['Point'], 
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],

    amenities: {
        type: [String],
        default: []
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },

    rooms: [
        {
            type: { type: String, enum: ["2-bed", "3-bed", "4-bed"] },
            capacity: Number,
            quantity: { type: Number, default: 2 },
            basePrice: Number // Room-specific base price if different from listing price
        }
    ]
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({
            _id: { $in: listing.reviews }
        });
    }
});

module.exports = mongoose.model("Listing", listingSchema);