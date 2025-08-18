import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscriptions.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    console.log(channelId)
     if(!channelId) {
        throw new ApiError(400, "channelId not available")
     }
     const alreadySubcribed = await Subscription.findOne(
        {
            subscriber: req.user._id,
            channel: channelId
        })
        //find one and delete doesnt return null return the deleted memory adress 
     if(alreadySubcribed){
        const unsubscribe = await Subscription.findOneAndDelete(
             {
            subscriber: req.user._id,
            channel: channelId
           }
        )
        return res.status(200)
                  .json(new ApiResponse(200, unsubscribe, "channel unsubscribed succesfully"))
     }
     const subscribed = await Subscription.create(
        {
            subscriber: req.user._id,
            channel: channelId
        }
     )
     return res
            .status(200)
            .json(new ApiResponse(200, subscribed, "channel subscribed succesfully"))
})
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    console.log(channelId)
     if(!channelId){
          throw new ApiError(400, "no id in params")
     }//return all the channels subscribers
     const userChannelSubcribers = await Subscription.find({channel: channelId})
     return res 
            .status(200)
            .json(new ApiResponse(200, userChannelSubcribers, "user subscriber fetched succesfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    console.log(subscriberId)
     if(!subscriberId){
          throw new ApiError(400, "no id in params")
     }
     
     const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
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
            $lookup: {
                from: "subscriptions",
                localField: "channel",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $addFields: {
                "channelDetails.subscribersCount": {
                    $size: "$subscribers"
                }
            }
        },
        {
            $replaceRoot: {
                newRoot: "$channelDetails"
            }
        }
     ])
     
     return res
               .status(200)
               .json(new ApiResponse(200, subscribedChannels, "subscribed channels fetched succesfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}