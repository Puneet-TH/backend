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
    
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }
    
    try {
        const pipeline = [
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
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
                                username: 1,
                                avatar: 1
                                // Removed _id and other sensitive fields for privacy
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
            },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    owner: 1
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ];

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            pagination: true
        };

        const comments = await Comment.aggregatePaginate(pipeline, options);
        
        return res.status(200).json(new ApiResponse(200, comments, "all comments of video fetched sucessfully"));
       
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json(new ApiResponse(500, [], "unable to fetch comments from db"));
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
