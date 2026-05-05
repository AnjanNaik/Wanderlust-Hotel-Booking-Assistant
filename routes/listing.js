const express = require("express");
const router = express.Router();

const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync");
const multer = require('multer')
const{storage}=require("../cloudconfig.js");
const upload = multer({storage});
const {
    isLoggedIn,
    isOwner,
    validateListing
} = require("../middleware");

const listingController = require("../controllers/listings");

router.route("/")
    .get(
        isLoggedIn,
        wrapAsync(listingController.index)
    )
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );
router.get(
    "/new",
    isLoggedIn,
    listingController.renderNewForm
);

// Suggestions should be public for a smooth search experience
router.get(
    "/suggestions",
    wrapAsync(listingController.searchSuggestions)
);
router.route("/:id")
    .get(
        isLoggedIn,
        wrapAsync(listingController.showListing)
    )
    .put(
        isLoggedIn,
        isOwner,
         upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.deleteListing)
    );
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);


module.exports = router;