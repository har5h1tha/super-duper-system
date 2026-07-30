import User from "../models/user.model.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const register=asyncHandler (async (req,res)=>{
    
        const {username,email,password}=req.body;
        if(!username || !email || !password){
            return res.status(400).json({
                message:"All fields are required"
            })
        }

        const isExist = await User.findOne({email});
        if(isExist){
            throw new ApiError(404,"User already exists");
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

export const login= async (req,res)=>{

    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({
                message:"All fields are required"
            })
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(409).json({
                message:"user invalid"
            })
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(401).json({
                message: "user Invalid ",
            })
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
    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }


}