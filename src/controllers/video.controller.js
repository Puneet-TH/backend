import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
/*
 {
  asset_id: '1ce82da5165ee18fdd580ebcda1ecdae',
  public_id: 'i1aiwqf61z3hvdrli8us',
  version: 1755019501,
  version_id: '4801e0bc8308e2183cb6fa63b8405e5c',
  signature: 'dcee19c20cd615accbc9b1418f65857542b7f292',
  width: 1920,
  height: 1080,
  format: 'mp4',
  resource_type: 'video',
  created_at: '2025-08-12T17:25:01Z',
  tags: [],
  pages: 0,
  bytes: 1206855,
  type: 'upload',
  etag: 'd5beee05cee240cc495513f58a944aa7',
  placeholder: false,
  url: 'http://res.cloudinary.com/dfqe8gmom/video/upload/v1755019501/i1aiwqf61z3hvdrli8us.mp4',
  secure_url: 'https://res.cloudinary.com/dfqe8gmom/video/upload/v1755019501/i1aiwqf61z3hvdrli8us.mp4',
  playback_url: 'https://res.cloudinary.com/dfqe8gmom/video/upload/sp_auto/v1755019501/i1aiwqf61z3hvdrli8us.m3u8',
  asset_folder: '',
  display_name: 'i1aiwqf61z3hvdrli8us',
  audio: {},
  video: {
    pix_format: 'yuv420p',
    codec: 'h264',
    level: 40,
    profile: 'Constrained Baseline',
    bit_rate: '1587933',
    dar: '16:9',
    time_base: '1/30000'
  },
  frame_rate: 30.303030303030305,
  bit_rate: 1589980,
  duration: 6.0723,
  rotation: 0,
  original_filename: 'vecteezy_the-footage-animation-of-countdown-timer-from-5-seconds_5148996',
  nb_frames: 184,
  api_key: '758476953251384'
}
{
  asset_id: '1a3062e96787ee4ca1d2587f929e2bb6',
  public_id: 'nrxkbewqpcc0yo5zmp2o',
  version: 1755019503,
  version_id: 'f76648c3b2238d34108a3dfff75b7aa9',
  signature: '2e570581afddb2c399b32bb17cefe1f10991e76e',
  width: 972,
  height: 1296,
  format: 'jpg',
  resource_type: 'image',
  created_at: '2025-08-12T17:25:03Z',
  tags: [],
  bytes: 50786,
  type: 'upload',
  etag: '51e82ab40b4d1192fcc0d975583982d4',
  placeholder: false,
  url: 'http://res.cloudinary.com/dfqe8gmom/image/upload/v1755019503/nrxkbewqpcc0yo5zmp2o.jpg',
  secure_url: 'https://res.cloudinary.com/dfqe8gmom/image/upload/v1755019503/nrxkbewqpcc0yo5zmp2o.jpg',
  asset_folder: '',
  display_name: 'nrxkbewqpcc0yo5zmp2o',
  original_filename: 'WhatsApp Image 2025-08-11 at 16.47.29_6e74df06',
  api_key: '758476953251384'
}
 
 */
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title || !description) {
        throw new ApiError(401, "title and description is necessary")
    }
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    console.log(thumbnailLocalPath);
    const videoFileLocalPath = req.files?.videoFile[0]?.path; 
    if(!videoFileLocalPath){
        throw new ApiError(401, "video is a required field")
    }
    
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    console.log(videoFile);
    let thumbnail = null;
    if(thumbnailLocalPath){
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    console.log(thumbnail);
    }
    
    const video = await Video.create(
        {
            videoFile: videoFile?.url,
            thumbnail: thumbnail?.url || null,
            title,
            description,
            owner: req.user?._id,
            duration: videoFile?.duration,
        }
    )

    return res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400, "unable to fetch videoId")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(501, "Internal server error")
    }
    return res
           .status(200)
           .json(new ApiResponse(200, video, "video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title , description} = req.body
    console.log(title,description,videoId)
    if(!videoId | !title | !description){
        throw new ApiError(400, "required fields not available")
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    let thumbnail = null;
    if(thumbnailLocalPath){
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    console.log(thumbnail);
    }

    try {
        const updated = await Video.findByIdAndUpdate(videoId , {
                    thumbnail: thumbnail,
                    title: title,
                    description: description,
        },
            {new : true}
        )
        
        return res 
                .status(200)
                .json(new ApiResponse(200, updated, "details updated sucessfully"))
    } catch (error) {
         throw new ApiError(500, "error in writing syntax of db query check again")
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    try {
        const deleted = Video.findByIdAndDelete(videoId)
        return res 
               .status(200)
               .json(new ApiResponse(200, deleted, "video deleted sucessfully"))
    } catch (error) {
        throw new ApiError(403, error? error : "no videoId in params ")
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(401, "no videoId in params")
    }
    const video =  await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "no video there")
    }
    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave:false})

    return res
           .status(200)
           .json(new ApiResponse(200, video, "video publish status is set to true"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
