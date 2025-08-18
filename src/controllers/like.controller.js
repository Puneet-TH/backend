import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(501, "unable to fetch videoId")
    }
    const videoLiked = await Like.findOne({ video: videoId, likedBy: req.user._id })
    if(videoLiked){
       const deleted =  await Like.deleteOne({_id : videoLiked._id})
        return res
               .status(200)
               .json(new ApiResponse(200, { liked: false }, "video unliked successfully"))          
    }
    const likeVideo = await Like.create({
        video : videoId,
        likedBy: req?.user._id
    })
    return res
           .status(200)
           .json(new ApiResponse(200, { liked: true }, "video liked successfully"))
   })

   
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(501, "unable to fetch commentId")
    }
    try {
            const commentLiked = await Like.findOne({comment : commentId, owner : req.user?._id})
            if(commentLiked){
                const deleted = await Like.deleteOne({_id : commentLiked._id}) 
                return res
                    .status(200)
                    .json(new ApiResponse(200, deleted, "already liked the current video"))          
            }
            const likeComment = await Like.create({
                comment : commentId,
                likedBy: req?.user._id
            })
            return res
                .status(200)
                .json(new ApiResponse(200, likeComment, "comment liked sucessfully"))
    } catch (error) {
        throw new ApiError(501, error ? error : "unable to like the comment internal server error")
}

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(501, "unable to fetch tweetId")
    }
   const tweetLiked = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })
    if(tweetLiked){
       const deleted =  await Like.deleteOne({_id : tweetLiked._id})
        return res
               .status(200)
               .json(new ApiResponse(200, deleted, "already unliked the current tweet"))          
    }
    const likeTweet = await Like.create({
        tweet : tweetId,
        likedBy: req?.user._id
    })
    return res
           .status(200)
           .json(new ApiResponse(200, likeTweet, "tweet liked sucessfully"))
   })

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user._id),
                    video: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails"
                }
            },
            {
                $unwind: "$videoDetails"
            },
            {
                $match: {
                    "videoDetails.isPublished": true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "videoDetails.owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            {
                $unwind: "$ownerDetails"
            },
            {
                $project: {
                    _id: "$videoDetails._id",
                    title: "$videoDetails.title",
                    description: "$videoDetails.description",
                    videoFile: "$videoDetails.videoFile",
                    thumbnail: "$videoDetails.thumbnail",
                    duration: "$videoDetails.duration",
                    views: "$videoDetails.views",
                    createdAt: "$videoDetails.createdAt",
                    owner: {
                        _id: "$ownerDetails._id",
                        username: "$ownerDetails.username",
                        fullName: "$ownerDetails.fullName",
                        avatar: "$ownerDetails.avatar"
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);

        return res
            .status(200)
            .json(new ApiResponse(200, likedVideos, "liked videos fetched successfully"));
            
    } catch (error) {
        console.error("Get liked videos error:", error);
        throw new ApiError(500, "Unable to fetch liked videos");
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}