import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    
    //used middleware verifyjwt for verifying user status and is stored in body
    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }
    const {content} = req.body
    console.log(content)
    const user = await User.findById(req.user?._id) 
    if(!user) {
        throw new ApiError(401, "cannot get tweet from user")
    }

   const tweet = await Tweet.create({ content, 
    owner: user._id });
    return res
           .status(200)
           .json(
            new ApiResponse(200, tweet, "succesfully tweeted")
           )
})
//throgh aggregation
// const getUserTweets = asyncHandler(async (req, res) => {
//     try {
//           const tweets = await User.aggregate([
//             { 
//                 $match: {
//                     _id: new mongoose.Types.ObjectId(req.user._id)
//                 }
//             }, 
//             {
//                 $lookup: {
//                     from: "tweets",//bydeafault plural if tweet so tweets
//                     localField: "_id",
//                     foreignField: "owner",
//                     as : "Tweets"
//                 }
//             }, 
//         {
//           $project: {
//             Tweets: 1,
//             username: 1,
//           }
//         }
//     ])
//     console.log(tweets);
//     return res
//            .status(400)
//            .json(new ApiResponse(200, tweets, "tweets fetched succesfully of the user"))
//     } catch (error) {
//           throw new ApiError(400, "unable to acess user tweets error in the db")
//     }

// })
//through simple find method of mongo db where we use filter to retreive data
const getUserTweets = asyncHandler(async (req, res) => {
    try {
      const tweets = await Tweet.find({ owner: req.user._id });
  
      return res.status(200).json(
        new ApiResponse(200, tweets, "User's tweets fetched successfully")
      );
    } catch (error) {
      console.error(error);
      throw new ApiError(400, "Unable to fetch user's tweets");
    }
  });
  

const updateTweet = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }
      const {content} = req.body
      const {tweetId} = req.params
      console.log(content)
      console.log(tweetId)
      if(!content || !tweetId) {
        throw new ApiError(400, "please provide new tweet content bad user request")
      }
       //$set is always used in findbyidand update
      const update = await Tweet.findByIdAndUpdate(tweetId, 
        {
            $set: {
                content : content
            }
        }, {new: true}
      )

      return res
            .status(200)
            .json(new ApiResponse(200, update, "user tweet updated succesfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
      const {tweetId} = req.params
      console.log(tweetId)
      const deleteTweet = await Tweet.findByIdAndDelete(tweetId)
      return res
             .status(200)
             .json(new ApiResponse(200, deleteTweet, "Tweet removed successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
