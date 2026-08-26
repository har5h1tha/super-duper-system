import User from "../models/user.model.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const register=asyncHandler (async (req,res)=>{
    
        const {username,email,password}=req.body;
        if(!username || !email || !password){
            throw new ApiError(400, "All fields are required");
        }

        const isExist = await User.findOne({email});
        if(isExist){
            throw new ApiError(409,"User already exists");
        }

        const hashedPswd= await bcrypt.hash(password,10);
        const user= await User.create({
            username,
            email,
            password:hashedPswd
        });

        res.status(200).json({
            message:"Registration Success",
            user
        })
});

export const login=asyncHandler ( async (req,res)=>{

        const {email,password}=req.body;
        if(!email || !password){
            throw new ApiError(400, "Email and password are required");
        }

        const user = await User.findOne({email});
        if(!user){
            throw new ApiError(401, "Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            throw new ApiError(401, "Invalid email or password");
        }
        
        const token = jwt.sign(
            {id : user._id},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        )
        res.status(200).json({
            message:"login Success",
            token
        })
})