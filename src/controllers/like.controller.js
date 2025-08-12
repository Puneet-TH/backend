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
    else{
    const likeVideo = await Like.create({
        video : videoId,
        likedBy: req?.user._id
    })
    return res
           .status(200)
           .json(new ApiResponse(200, likeVideo, "video liked sucessfully"))
   }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(501, "unable to fetch commentId")
    }
    const commentLiked = await Like.findById(commentId)
    if(commentLiked){
        return res
               .status(200)
               .json(new ApiResponse(200, commentLiked, "already liked the current video"))          
    }
    const likeComment = await Like.create({
        comment : videoId,
        likedBy: req?.user._id
    })
    return res
           .status(200)
           .json(new ApiResponse(200, likeComment, "comment liked sucessfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}