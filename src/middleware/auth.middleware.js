import jwt from "jsonwebtoken"

const authMiddleware = (req,res,next)=>{
    try{
        console.log(req.headers);
        const authHeader = req.headers.authorization
        if(!authHeader){
            return res.status(401).json({
                message:"no token provided"
            })
        }

        const token = authHeader.split(" ")[1]
        const decode = jwt.verify(token , process.env.JWT_SECRET)
        req.user = decode
        next()
    }catch (err) {
    console.log(err);
    return res.status(401).json({
        message: err.message,
    });
}
}
export default authMiddleware;