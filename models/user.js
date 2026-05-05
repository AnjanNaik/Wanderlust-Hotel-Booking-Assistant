const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    wishlist: [
        {
            type: Schema.Types.ObjectId,
            ref: "Listing",
        }
    ],
    name: {
        type: String,
        required: true,
        default: "User"
    },
    bio: {
        type: String,
        default: ""
    },
    avatar: {
        url: String,
        filename: String
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);