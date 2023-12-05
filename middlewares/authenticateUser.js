module.exports = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.session.error = "You have to login first";
    res.redirect("/");
  }
};
