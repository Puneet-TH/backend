import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"

const generateAcessAndRefreshToken =async(userId) => {
    try {
      const user = await User.findById(userId)
      const acessToken = user.generateAcessToken()
      const refreshToken = user.generateRefreshToken()
      
      //since db is an object so adding data in object using . simple
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false})

      return {acessToken, refreshToken}

    } catch (error) {
       throw new ApiError(500, "Something went wrong while generating token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    
   const {fullName, email, username, password} = req.body
   console.log("email: ", email); 

//    if(fullName === ""){
//     throw new ApiError(400, "fullname is required")
//    }
if([fullName, email, username, password].some((field) => field?.trim() === "")){
     throw new ApiError(400, "All fields are compulsory")
    }

 const existedUser = await User.findOne({
    $or: [{ username }, { email }]
 })

 if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
 }
   
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverimageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }
  if(!avatarLocalPath){
     throw new ApiError(400, "Avatar image is required")
  }

 //uploading to cloudanary
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400, "Avatar image is required")
   }
  
 const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })
 //syntax of .select("-fieldname -secondfield") not to be added 
 const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
 )

 if(!createdUser){
    throw new ApiError(500, "something went wrong while registering the user")
 }
    
 return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered Succesfully")
 )
   
})

const loginUser = asyncHandler(async(req, res) => {
     //destructuring the body to get username and password
      const {email, username, password} = req.body;
      if(!username && !email){
         throw new ApiError(400, "username or password is required")
      }
// Here is an alternative of above code like if we want any one of them
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }
     const user = await  User.findOne({
         //$ is used for mongo operator
         $or : [{username}, {email}]
      })

      if(!user){
         throw new ApiError(404, "user doesnt exist register first")
      }

     const isPasswordValid =  await user.isPasswordCorrect(password)
     if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credential")
     }
     
     const {acessToken, refreshToken} = await generateAcessAndRefreshToken(user._id)
     
     const loggedInUser = await User.findById(user._id)
     .select("-password -refreshToken")

     const options = {
      httOnly : true,
      secure: true
     }

     return  res
     .status(200)
     .cookie("acessToken", acessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
      new ApiResponse(
         200,
         {
            user : loggedInUser, acessToken, refreshToken
         },
         "user logged in success"
      )
     )

   })

const logoutUser = asyncHandler(async(req, res) => {
   //made a middle taki hum user data pass karsake after verification and can be used in the req body for working of logout function
      const userId = req.user._id
   //moti baat user ka data acess ke liye middle ware bnwaya
   //aur verification bhi sath ke sath ho ri h middleware mei
      await User.findByIdAndUpdate(userId, {
         $set: {
            refreshToken: undefined
         }
      },
      {
         new : true
      }
   )

   const options = {
      httOnly : true,
      secure: true
     }
  
     return res
     .status(200)
     .clearCookie("acessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200, {}, "User logged Out"))

   }
)

const refreshAcessToken = asyncHandler(async(req, res) => {
   const incoming =  req.cookies.refreshToken || req.body.refreshToken 
    
   if(!incoming){
      throw new ApiError(401, "refresh Token not available in cookies unauthorized req")
   }
   
try {
   const decodedToken = jwt.verify(incoming, process.env.REFRESH_TOKEN_SECRET)
   
   const user = await User.findById(decodedToken?._id)
      if(!user){
            throw new ApiError(401, "refresh Token not available in db unauthorized req")
         }
    
      if(incoming !== user?.refreshToken){
           throw new ApiError(401, "refresh token is expired or used")
      }
     const options = {
        httpOnly: true,
        secure: true
     }
   
   const {acessToken, newrefreshToken} = await generateAcessAndRefreshToken(user._id)
      
     return res
     .status(200)
     .cookie("acessToken", acessToken, options)
     .cookie("refreshToken", newrefreshToken, options)
     .json(
        new ApiResponse(
         200,
         {acessToken, refreshToken : newrefreshToken},
         "Acess token refreshed sucessfully"
        )
      )
} catch (error) {
   throw new ApiError(401, error?.message || "invalid refresh token")
}

})
export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAcessToken
}


// get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    //or simply 


//form data lunga
//validating data of user
//already exists or not
//verify bhi karaunga 
//phir data ko database mei store karaunga  
//phir usko token dedunga taki agli baar login kare toh verified user dikhae


//sabse email pass req body
//check ki user h agar h toh theek vrna register user first
//pass check if wrong or right 
//generate refresh token and acess
//send cookie's 