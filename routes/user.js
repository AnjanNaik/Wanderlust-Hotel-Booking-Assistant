const express = require("express");
const router = express.Router();

const passport = require("passport");
const User = require("../models/user");

const { saveRedirectUrl, isLoggedIn } = require("../middleware");
const Listing = require("../models/listing");
const Booking = require("../models/booking");


router.route("/my-bookings")
    .get(isLoggedIn, async (req, res) => {
        const bookings = await Booking.find({ user: req.user._id }).populate("listing");
        res.render("users/bookings", { bookings });
    });

router.route("/bookings/:id")
    .delete(isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        
        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/my-bookings");
        }
        
        if (!booking.user.equals(req.user._id)) {
            req.flash("error", "You do not have permission to cancel this trip!");
            return res.redirect("/my-bookings");
        }
        
        await Booking.findByIdAndDelete(id);
        req.flash("success", "Trip cancelled successfully!");
        res.redirect("/my-bookings");
    });

router.route("/host-dashboard")
    .get(isLoggedIn, async (req, res) => {
     
        const hostListings = await Listing.find({ owner: req.user._id });
        const listingIds = hostListings.map(listing => listing._id);
        
        
        const bookings = await Booking.find({ listing: { $in: listingIds } })
            .populate("listing")
            .populate("user")
            .sort({ checkIn: 1 });
            
        res.render("users/dashboard", { bookings, hostListings });
    });

router.route("/wishlist")
    .get(isLoggedIn, async (req, res) => {
        const user = await User.findById(req.user._id).populate("wishlist");
        res.render("users/wishlist", { allListings: user.wishlist });
    });

router.route("/wishlist/:id")
    .post(isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const user = await User.findById(req.user._id);
        
        if (user.wishlist.includes(id)) {
            user.wishlist.pull(id);
            req.flash("success", "Removed from Wishlist!");
        } else {
            user.wishlist.push(id);
            req.flash("success", "Added to Wishlist!");
        }
        
        await user.save();
        res.redirect("back");
    });

router.route("/signup")

.get((req, res) => {
    res.render("users/signup");
})

.post(async (req, res, next) => {
    try {

        let { username, email, password } = req.body;

        const newUser = new User({
            username,
            email,
        });

        const registeredUser =
            await User.register(newUser, password);

        req.login(registeredUser, (err) => {

            if (err) return next(err);

            req.flash("success", "Welcome");

            res.redirect("/listings");
        });

    } catch (e) {

        req.flash("error", e.message);

        res.redirect("/signup");
    }
});


router.route("/login")

.get((req, res) => {
    res.render("users/login");
})

.post(
    saveRedirectUrl,

    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),

    (req, res) => {

        req.flash("success", "Welcome back");

        res.redirect("/listings");
    }
);


router.route("/logout")

.get((req, res, next) => {

    req.logout((err) => {

        if (err) return next(err);

        req.flash("success", "Logged out");

        res.redirect("/listings");
    });
});


module.exports = router;