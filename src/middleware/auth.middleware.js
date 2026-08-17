import jwt from "jsonwebtoken"
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const authMiddleware = asyncHandler((req,res,next)=>{
    
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Invalid authorization header");
        }

        const token = authHeader.split(" ")[1]
        const decode = jwt.verify(token , process.env.JWT_SECRET)
        req.user = decode
        
        next()

})
export default authMiddleware;