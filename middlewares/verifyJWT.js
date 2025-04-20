import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

/*
const payload = {
      id: user._id,
      name: user.name
    };
*/
const verify = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("verifying token")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = await jwt.verify(token, JWT_SECRET);
        req.userName = decoded.name;
        req.userId = decoded.id
        next();
    } catch (err) {
        console.log("ero in token")
        console.log(err)
        return res.status(403).json({ error: "Invalid or expired token. " });
    }
};

export default verify;
