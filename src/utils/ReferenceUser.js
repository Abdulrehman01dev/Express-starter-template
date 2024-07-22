
module.exports = (field) => {
    return (req, res, next) => {
        //console.log(req.body);
        req.body[field] = req.user.id;
        next();
    }
  }
