import jwt from "jsonwebtoken";

// admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {
    const { atoken } = req.headers;

    if (!atoken) {
      return res.json({ success: false, message: "Not Authorized, Login Again" });
    }

    // ✅ decode the token
    const decoded = jwt.verify(atoken, process.env.JWT_SECRET);

    // ✅ check that decoded email matches admin email from .env
    if (decoded.email !== process.env.ADMIN_EMAIL) {
      return res.json({ success: false, message: "Not Authorized, Login Again" });
    }

    // ✅ everything ok
    next();

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Not Authorized, Login Again" });
  }
};

export default authAdmin;
