import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import { Subscription } from "../models/subscriptions.models.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
        try {
                const totalSubscriber = await Subscription.aggregate([
                    {
                        $match: {
                            channel: new mongoose.Types.ObjectId(req.user?._id)
                        }
                    },{
                        $group: {
                            _id : null,
                            totalSubscriberCount : {$sum : 1}
                        }
                    },{
                        $project: {
                            _id  : 0,
                            totalSubscriberCount: 1
                        }
                    }
                ])
            
                const totalVideoViews = await Video.aggregate([
                    {
                        $match: {
                            owner : new mongoose.Types.ObjectId(req.user?._id)
                        }
                    },{
                        $group: {
                            _id: null,
                            totalViewsCount: {$sum : "$views"}
                        }
                    },{
                        $project: {
                            _id : 0,
                            totalViewsCount: 1
                        }
                    }
                ])
            
                const totalVideos = await Video.aggregate([
                    { 
                        $match: {
                            owner : new mongoose.Types.ObjectId(req.user?._id)
                        }
                    }, {
                        $group: {
                            _id: null,
                            totalVideosCount: {$sum : 1}
                        }
                    },{
                        $project: {
                            _id : 0,
                            totalVideosCount: 1
                        }
                    }
                ])
            
                const totalLikes = await Like.aggregate([
                    { 
                        $match: {
                            likedBy : new mongoose.Types.ObjectId(req.user?._id)
                        }
                    }, {
                        $group: {
                            _id : null,
                            totalLikesCount : {$sum : 1}
                        }
                    },{
                        $project: {
                            _id: 0,
                            totalLikesCount: 1
                        }
                    }
                ])
             console.log(totalLikes,totalSubscriber,totalVideoViews,totalVideos);
                return res
                        .status(200)
                        .json(new ApiResponse(200, 
                            {
                            totalvideos : totalVideos[0]?.totalVideosCount || 0,
                            likesCount  : totalLikes[0]?.totalLikesCount || 0,
                            viewsCount : totalVideoViews[0]?.totalViewsCount || 0,
                            subscribersCount : totalSubscriber[0]?.totalSubscriberCount || 0 
                        },
                               "stats fetched sucessfully"))
        } catch (error) {
            throw new ApiError(501, error ? error : "error fetcching from the DB")
        }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    try {
            const channelVideos = await Video.aggregate([
                {
                    $match: {
                        owner : new mongoose.Types.ObjectId(req.user?._id)
                    }
                },{
                $project: {
                    videoFile : 1,
                    thumbnail: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    views: 1,
                    duration :1,
                    title: 1,
                
                }
                }
            ])
        
            return res.status(200).json(new ApiResponse(200, channelVideos, "all videos of channel fetched sucessfully"))
    } catch (error) {
        throw new ApiError(501, error ? error : "error fetcching from the DB")
    }
})
 
export {
    getChannelStats, 
    getChannelVideos
    }