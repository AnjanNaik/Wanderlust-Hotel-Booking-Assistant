const Listing = require("../models/listing");
const { geocodeLocation } = require("../utils/geocoding");

module.exports.index = async (req, res) => {
    let queryObj = {};
    if (req.query.q) {
        const searchTerms = req.query.q.trim().split(/\s+/).map(term => new RegExp(term, 'i'));
        
        // Smart Multi-Word Search: Match any of the words in location, title, or country
        const conditions = [];
        searchTerms.forEach(regex => {
            conditions.push({ location: regex });
            conditions.push({ title: regex });
            conditions.push({ country: regex });
        });
        
        queryObj = {
            $or: conditions
        };
    } else if (req.query.category) {
        queryObj.category = req.query.category;
    }
    const allListings = await Listing.find(queryObj).populate("reviews");
    res.render("listings/index", { 
        allListings, 
        searchQuery: req.query.q || null,
        activeCategory: req.query.category || null
    });
};

module.exports.searchSuggestions = async (req, res) => {
    let { q } = req.query;
    if (!q) return res.json([]);

    const searchTerms = q.trim().split(/\s+/).map(term => new RegExp(term, 'i'));
    
    const conditions = [];
    searchTerms.forEach(regex => {
        conditions.push({ location: regex });
        conditions.push({ title: regex });
        conditions.push({ country: regex });
    });

    // Find matching documents and extract unique locations/countries/titles
    const listings = await Listing.find({
        $or: conditions
    }).limit(10).select("location country title");

    let suggestions = new Set();
    const queryLowerWords = q.trim().toLowerCase().split(/\s+/);
    
    listings.forEach(listing => {
        queryLowerWords.forEach(word => {
            if (listing.location && listing.location.toLowerCase().includes(word)) suggestions.add(listing.location);
            if (listing.country && listing.country.toLowerCase().includes(word)) suggestions.add(listing.country);
            if (listing.title && listing.title.toLowerCase().includes(word)) suggestions.add(listing.title);
        });
    });

    res.json(Array.from(suggestions).slice(0, 5));
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        });

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    if (listing.amenities.length === 0) {
        listing.amenities = ["Wifi", "Kitchen", "Free Parking", "TV", "Air Conditioning"];
    }

    if (listing.rooms.length === 0) {
        listing.rooms = [
            { type: "2-bed", capacity: 2, quantity: 5, basePrice: listing.price },
            { type: "3-bed", capacity: 3, quantity: 2, basePrice: Math.round(listing.price * 1.4) },
            { type: "4-bed", capacity: 4, quantity: 1, basePrice: Math.round(listing.price * 1.8) }
        ];
    }

    res.render("listings/show", { listing });
};

module.exports.createListing = async (req, res) => {
    if (!req.file) {
        req.flash("error", "Please upload an image for your listing");
        return res.redirect("/listings/new");
    }
    let url = req.file.path;
    let filename = req.file.filename;
    
    const newListing = new Listing(req.body.listing);
    newListing.geometry = await geocodeLocation(newListing.location);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    await newListing.save();
    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
     if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl = originalImageUrl.replace("upload","/upload/h_300,w_250");
    res.render("listings/edit", { listing,originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    
   
    let location = req.body.listing.location;
    let geometry = await geocodeLocation(location);

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing, geometry });

    if(typeof req.file !=="undefined"){
        let url = req.file.path;
        let filename=req.file.filename;
        listing.image = {url, filename};
        await listing.save();
    }
    req.flash("success", "Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Deleted");
    
    // Redirect to dashboard if the request came from there, otherwise to listings index
    const redirectUrl = req.headers.referer && req.headers.referer.includes("host/listings") 
        ? "/host/listings" 
        : "/listings";
    res.redirect(redirectUrl);
};