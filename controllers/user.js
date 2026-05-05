const User = require("../models/user");


module.exports.renderSignup = (req, res) => {
    res.render("users/signup");
};


module.exports.signup = async (req, res, next) => {

    try {

        let { username, email, password } = req.body;

        const newUser = new User({
            username,
            email
        });

        const registeredUser = await User.register(
            newUser,
            password
        );

        req.login(registeredUser, (err) => {
            if (err) return next(err);

            
            res.redirect("/listings");
        });

    } catch (e) {

        req.flash("error", e.message);

        res.redirect("/signup");
    }
};


module.exports.renderLogin = (req, res) => {
    res.render("users/login");
};


module.exports.login = (req, res) => {

   

    res.redirect("/listings");
};


module.exports.logout = (req, res, next) => {

    req.logout((err) => {

        if (err) return next(err);

        res.redirect("/listings");
    });
};