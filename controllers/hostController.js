const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/reviews");
const User = require("../models/user");

module.exports.index = async (req, res) => {
    const hostListings = await Listing.find({ owner: req.user._id });
    const listingIds = hostListings.map(l => l._id);

    const totalListings = hostListings.length;
    const bookings = await Booking.find({ listing: { $in: listingIds } }).populate("user").populate("listing");
    const totalBookings = bookings.length;

    const totalEarnings = bookings.reduce((acc, curr) => acc + curr.totalPrice, 0);

    const upcomingBookings = bookings.filter(b => new Date(b.checkIn) >= new Date()).slice(0, 5);

    res.render("host/dashboard", {
        totalListings,
        totalBookings,
        totalEarnings,
        upcomingBookings,
        activePage: "dashboard"
    });
};

module.exports.listings = async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id });
    res.render("host/listings", { listings, activePage: "listings" });
};

module.exports.bookings = async (req, res) => {
    const hostListings = await Listing.find({ owner: req.user._id });
    const listingIds = hostListings.map(l => l._id);
    const bookings = await Booking.find({ listing: { $in: listingIds } })
        .populate("user")
        .populate("listing")
        .sort({ createdAt: -1 });
    res.render("host/bookings", { bookings, activePage: "bookings" });
};

module.exports.earnings = async (req, res) => {
    const hostListings = await Listing.find({ owner: req.user._id });
    const listingIds = hostListings.map(l => l._id);
    const bookings = await Booking.find({ listing: { $in: listingIds } }).sort({ createdAt: -1 });

    const totalEarnings = bookings.reduce((acc, curr) => acc + curr.totalPrice, 0);

    // Monthly breakdown
    const monthlyEarnings = {};
    bookings.forEach(b => {
        const month = new Date(b.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthlyEarnings[month] = (monthlyEarnings[month] || 0) + b.totalPrice;
    });

    res.render("host/earnings", { totalEarnings, monthlyEarnings, activePage: "earnings" });
};

module.exports.reviews = async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id }).populate({
        path: "reviews",
        populate: { path: "author" }
    });
    
    let allReviews = [];
    listings.forEach(l => {
        l.reviews.forEach(r => {
            allReviews.push({ ...r._doc, listingTitle: l.title });
        });
    });

    res.render("host/reviews", { reviews: allReviews, activePage: "reviews" });
};

module.exports.profile = async (req, res) => {
    const user = await User.findById(req.user._id);
    res.render("host/profile", { user, activePage: "profile" });
};

module.exports.updateProfile = async (req, res) => {
    const { name, email, bio } = req.body;
    let updateData = { name, email, bio };
    
    if (req.file) {
        updateData.avatar = {
            url: req.file.path,
            filename: req.file.filename
        };
    }
    
    await User.findByIdAndUpdate(req.user._id, updateData);
    req.flash("success", "Profile updated successfully!");
    res.redirect("/host/profile");
};

module.exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        await user.changePassword(oldPassword, newPassword);
        req.flash("success", "Password changed successfully!");
        res.redirect("/host/profile");
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/host/profile");
    }
};

module.exports.toggleListingStatus = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "Unauthorized action");
        return res.redirect("/host/listings");
    }
    listing.status = listing.status === "active" ? "inactive" : "active";
    await listing.save();
    req.flash("success", `Listing status updated to ${listing.status}`);
    res.redirect("/host/listings");
};
