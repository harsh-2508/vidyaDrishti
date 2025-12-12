import jwt from "jsonwebtoken";

// 1.Authenication
export const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication failed: No token provided." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.json(401).json({message: 'Authentication failed: Invalid token.'});
  }
};


// 2.Authorization
export const authorize=(role)=>{
  return (req,res,next)=>{
    if(req.user && req.user.role===role){
      return res.status(403).json({message: `Forbidden: Access is restricted to role '${role}'.`});
    }
  }

}