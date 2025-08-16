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
               .json(new ApiResponse(200, deleted, "already unliked the current video"))          
    }
    const likeVideo = await Like.create({
        video : videoId,
        likedBy: req?.user._id
    })
    return res
           .status(200)
           .json(new ApiResponse(200, likeVideo, "video liked sucessfully"))
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
        //TODO: get all liked videos
try {

  const allLikedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos", // collection name
                localField: "video",
                foreignField: "_id",
                as: "allVideos"
            }
        },{$unwind: "$allVideos"},
        {
            $lookup: {
                from: "users", // collection name
                localField: "allVideos.owner",
                foreignField: "_id",
                as: "allLikedVideosOwner"
            }
        },{$unwind: "$allLikedVideosOwner"},
        {
            $project: {
                owner: {
              _id: "$allLikedVideosOwner._id",
              username: "$allLikedVideosOwner.username",
              avatar: "$allLikedVideosOwner.avatar"
               },
                videoFile: "$allVideos.videoFile",
                username: "$allVideos.username",
                description: "$allVideos.description",
                likedBy: "$allVideos.likedBy",
                thumbnail: "$allVideos.thumbnail",
                avatar: "$allVideos.avatar",
                views: "$allVideos.views",
                duration: "$allVideos.duration",
                isPublished: "$allVideos.isPublished"
        }
    }
    ])
      return res.status(200).json(new ApiResponse(200, allLikedVideos?.[0], "all videos liked by user fetched sucessfully"))
    } catch (error) {
        throw new ApiError(500, error? error : "unable to fetch from DB")
}
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}