import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"
import { Subscription } from '../models/subscriptions.models.js'
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async(userId) => {
    try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      
      //since db is an object so adding data in object using . simple
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false})//checks for if teh required fields are there or not if enabled false bypass these check bydefault

      return {accessToken, refreshToken}

    } catch (error) {
       throw new ApiError(500, "Something went wrong while generating token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    
 const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

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
     
     const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
     
     const loggedInUser = await User.findById(user._id)
     .select("-password -refreshToken")

     const options = {
      httOnly : true,
      secure: true
     }

     return  res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
      new ApiResponse(
         200,
         {
            user : loggedInUser, accessToken, refreshToken
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
         $unset: {
            refreshToken: 1
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
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200, {}, "User logged Out"))

   }
)

const refreshAccessToken = asyncHandler(async(req, res) => {
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
   
   const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)
      
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
        new ApiResponse(
         200,
         {accessToken, refreshToken: newRefreshToken},
         "Access token refreshed successfully"
        )
      )
} catch (error) {
   throw new ApiError(401, error?.message || "invalid refresh token")
}

})

const changeCurrentPassword = asyncHandler(async(req,res)=> {
   const {oldPassword, newPassword} = req.body

 try {
     const user = await User.findById(req.user?._id);
     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
     if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
     }
  
     user.password = newPassword
     await user.save({validateBeforeSave: false})
 } catch (error) {
   //400 = badrequest
     throw new ApiError(400, "password couldn't be changed due to server error")
 }

   return res
   .status(200)
   .json(new ApiResponse(200, {}, "Password Changed succesfully"))
})

const getCurrentUser  = asyncHandler(async(req, res) => {
       return  res
       .status(200)
       .json(new ApiResponse(200, req.user, "current user fetched succesfully"))
      
      })

const updateAccountDetails = asyncHandler(async(req, res) => {

   const{fullName, email, username} = req.body;
   
   if(!fullName || !email || !username){
      throw new ApiError(400, "All fields are required")
   }

   // Check if username or email already exists for another user
   const existingUser = await User.findOne({
      $and: [
         { _id: { $ne: req.user._id } }, // Exclude current user
         { $or: [{ username }, { email }] }
      ]
   });

   if (existingUser) {
      if (existingUser.username === username) {
         throw new ApiError(409, "Username already exists");
      }
      if (existingUser.email === email) {
         throw new ApiError(409, "Email already exists");
      }
   }

  //check  //$set is always used in findbyidand update
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName,
            email,
            username
         }
      },
      {new: true} //update hone ke baad vali info return hoti h 
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "Account details updated successfully"))
    
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
      throw new ApiError(400, "avatar file is missing")
    }
   //todo delete old image - assingment
   try {
       const avatar = await uploadOnCloudinary(avatarLocalPath)
       if(!avatar.url){
         throw new ApiError(400, "Error while uploading on avatar")
       }
       
       const user = await User.findByIdAndUpdate(req.user?._id,
         {
            $set : {
               avatar : avatar.url
            },
         }, {new: true}).select("-password")

 return res
         .status(200)
         .json(
            new ApiResponse(200, user, "avatar updated sucessfully")
         )
      
   } catch (error) {
      throw new ApiError(400, error?.message || "unable to fetch avatar")
   }
 })


const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverLocalPath = req.file?.path

    if(!coverLocalPath){
      throw new ApiError(400, "cover image file is missing")
    }
try {
   
       const coverImage = await uploadOnCloudinary(coverLocalPath)
       if(!cover.url){
         throw new ApiError(400, "Error while uploading on coverImage")
       }
       
       const user = await User.findByIdAndUpdate(req.user?._id,
         {
            $set : {
               coverImage : coverImage.url
            },
         }, {new: true}).select("-password")
   return res
            .status(200)
            .json(
               new ApiResponse(200, user, "cover image updated sucessfully")
            )
} 
catch (error) {
   throw new ApiError(400, error?.message || "unable to fetch cover image")
}

 })
//aggregation pipeline
const getUserChannelProfile = asyncHandler(async(req, res) =>  {
         const {username} = req.params
         if(!username?.trim()) {
         throw new ApiError(400, "usename is missing")
         }

       const channel = await User.aggregate([
         {
            $match: {
               username: username?.toLowerCase()
            }, 
         },
         {
             $lookup: {
               from: "subscriptions",
               localField: "_id",
               foreignField: "channel",
               as: "subscribers"
             }
         },
         {
            $lookup: {
               from: "subscriptions",
               localField: "_id",
               foreignField: "subscriber",
               as: "subscribedTo"
            }
         },
         {
            $lookup: {
               from: "videos",
               localField: "_id",
               foreignField: "owner",
               as: "videos",
               pipeline: [
                  {
                     $match: {
                        isPublished: true
                     }
                  },
                  {
                     $sort: {
                        createdAt: -1
                     }
                  },
                  {
                     $project: {
                        _id: 1,
                        title: 1,
                        thumbnail: 1,
                        videoFile: 1,
                        duration: 1,
                        views: 1,
                        createdAt: 1,
                        owner: 1
                     }
                  },
                  {
                     $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                           {
                              $project: {
                                 _id: 1,
                                 username: 1,
                                 fullName: 1,
                                 avatar: 1
                              }
                           }
                        ]
                     }
                  },
                  {
                     $unwind: "$owner"
                  }
               ]
            }
         },
         {
            $addFields: {
               SubscribersCount: {
                  $size: "$subscribers"
               },
               channelSubscribedToCount: {
                  $size: "$subscribedTo"
               },
               isSubscribed: {
                     $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false,
                     }
                  }
               }
         },
         {
            $project: {
               fullName: 1,
               username: 1,
               SubscribersCount: 1,
               channelSubscribedToCount: 1,
               isSubscribed: 1,
               avatar: 1,
               coverImage: 1,
               email: 1,
               videos: 1,
               createdAt: 1
            }
         }
       ])
       console.log(channel)

       if(!channel?.length){
         throw new ApiError(400, "channel does not exist")
       }
      
       return res
       .status(200)
       .json(
         new ApiResponse(200, channel[0], "user channel record fetched succesfully")
       )
})

const getWatchHitory = asyncHandler(async(req, res) => {
      const user = await User.aggregate([
         {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user._id)
            },
         },
         {
            $lookup: {
               from: "videos",
               localField: "watchHistory",
               foreignField: "_id",
               as: "watchHistory",
               pipeline: [
                  {
                     $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                           {
                              $project: {
                                 fullName: 1,
                                 username: 1,
                                 avatar: 1
                              }
                           }
                        ]
                     }
                  },
                  {
                     $addFields: {
                        owner: {
                           $first: "$owner"
                        }
                     } 
                  }
               ]
            }
         }
      ])

      return res
      .status(200)
      .json(
         new ApiResponse(200, 
            user[0].watchHistory,
            "watch history fetched succesfully"
         )
      )
})
 
export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHitory,

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

