const express = require("express");
const router = express.Router({ mergeParams: true });

const crypto = require("crypto");

const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");

router.post("/create-order", isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, guests } = req.body;

        if (!checkIn || !checkOut || !guests) {
            req.flash("error", "All booking details are required.");
            return res.status(400).json({
                success: false,
                redirectUrl: `/listings/${id}`
            });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkOutDate <= checkInDate) {
            req.flash("error", "Check-out date must be after check-in date.");
            return res.status(400).json({
                success: false,
                redirectUrl: `/listings/${id}`
            });
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.status(404).json({
                success: false,
                redirectUrl: "/listings"
            });
        }

        const conflictingBooking = await Booking.findOne({
            listing: id,
            paymentStatus: "Completed",
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
        });

        if (conflictingBooking) {
            req.flash("error", "These dates are already booked!");
            return res.status(400).json({
                success: false,
                redirectUrl: `/listings/${id}`
            });
        }

        const nights = Math.ceil(
            (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
        );

        const { selectedRooms } = req.body;
        let totalRoomPricePerNight = 0;

        if (selectedRooms && selectedRooms.length > 0) {
            selectedRooms.forEach(room => {
                totalRoomPricePerNight += (room.price * room.count);
            });
        } else {
            totalRoomPricePerNight = listing.price;
        }

        let basePrice = nights * totalRoomPricePerNight;
        let discount = nights >= 7 ? basePrice * 0.10 : 0;
        let subtotal = basePrice - discount;
        let totalPrice = Math.round(subtotal * 1.18);

        const razorpay = require("../utils/razorpay");
        const options = {
            amount: totalPrice * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        return res.json({
            success: true,
            paymentMethod: 'razorpay',
            key_id: process.env.RAZORPAY_KEY_ID,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            listing_title: listing.title,
            booking_details: { checkIn, checkOut, guests, nights, totalPrice },
            selectedRooms
        });

    } catch (err) {
        console.error("Create Order Error:", err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating payment order.",
            redirectUrl: `/listings/${id}`
        });
    }
});

router.post("/verify-payment", isLoggedIn, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_details, selectedRooms } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_details) {
            req.flash("error", "Missing payment details.");
            return res.status(400).json({ success: false, redirectUrl: `/listings/${req.params.id}` });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const crypto = require("crypto");
        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");

        if (expectedSignature !== razorpay_signature) {
            req.flash("error", "Invalid signature!");
            return res.status(400).json({ success: false, redirectUrl: `/listings/${req.params.id}` });
        }

        const existingBooking = await Booking.findOne({
            listing: req.params.id,
            paymentStatus: "Completed",
            checkIn: { $lt: new Date(booking_details.checkOut) },
            checkOut: { $gt: new Date(booking_details.checkIn) }
        });

        if (existingBooking) {
            req.flash("error", "Sorry, these dates were booked by another user during payment.");
            return res.status(400).json({
                success: false,
                redirectUrl: `/listings/${req.params.id}`
            });
        }

        const newBooking = new Booking({
            listing: req.params.id,
            user: req.user._id,
            checkIn: new Date(booking_details.checkIn),
            checkOut: new Date(booking_details.checkOut),
            guests: booking_details.guests,
            totalPrice: booking_details.totalPrice,
            paymentStatus: "Completed",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            selectedRooms: selectedRooms
        });

        await newBooking.save();

        req.flash("success", "Booking confirmed successfully!");
        return res.json({
            success: true,
            redirectUrl: "/my-bookings",
            bookingId: newBooking._id
        });

    } catch (err) {
        console.error("Payment Verification Error:", err);
        req.flash("error", "Payment verified, but booking could not be saved.");
        return res.status(500).json({
            success: false,
            redirectUrl: `/listings/${req.params.id}`
        });
    }
});

module.exports = router;