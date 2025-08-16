import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
        if(!videoId){
            throw new ApiError(401, "wrong Id format in the params")
        }
    try {
        const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        pagination: true
       }
        const comments = await Comment.aggregatePaginate([
            {
                $match :{
                    video :  new mongoose.Types.ObjectId(videoId)
                }
            },{
                $lookup: {
                    from : "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "commentsOwner"
                }
            },
            {$unwind: "$commentsOwner"}
            ,{
                $project: {
                    content: 1,
                    createdAt : 1,
                    owner: "$commentsOwners.owner",   
                    username: "$commentsOwner.username",
                    avatar: "$commentsOwner.avatar"
                }
            }
        ], options)
        
        return res.status(200).json(new ApiResponse(200, comments,"all comments of video fetched sucessfully"))
       

    } catch (error) {
        throw new ApiError(500, error? error : "unable to fetch from db")
    }
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if(!content || !videoId){
        throw new ApiError(401, "error with videoId or content")
    }
   try {
     const comment = await Comment.create({
           content : content,
           video : videoId,
           owner : req.user?._id
     })
     return res
            .status(200)
            .json(new ApiResponse(200, comment, "comment added sucessfully"))
     
   } catch (error) {
        throw new ApiError(500, error? error : "unable to fetch from db")
   }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if(!commentId || !content) {
        throw new ApiError(401, "wrong comment Id and content")
    }
    try {

        const updatedComment = await Comment.findOneAndUpdate({_id : commentId}, {
            $set: {
                content : content
            }
        } ,
       {new: true})

       return res.status(200).json(new ApiResponse(200, updatedComment, "comment updated succesfully"))
        
    } catch (error) {
        throw new ApiError(500, error? error : "unable to fetch from DB")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    try {
           const deletedComment = await Comment.findByIdAndDelete(commentId)
           return res.status(200).json(new ApiResponse(200, deleteComment, "comment removed sucessfully"))
    } catch (error) {
        throw new ApiError(500, error? error : "error in deleting from DB")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
