import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    //time , views 
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    //pagination - https://codebeyondlimits.com/articles/pagination-in-mongodb-the-only-right-way-to-implement-it-and-avoid-common-mistakes
    
    // Validate userId only if provided
    if (userId && !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID format")
    }
    
    // Validate sortBy field
    const validSortFields = ["createdAt", "views", "duration", "title"];
    if (!validSortFields.includes(sortBy)) {
        throw new ApiError(400, `Invalid sortBy field. Valid options: ${validSortFields.join(", ")}`);
    }
  try {

    // Build match condition
    const matchCondition = {
        isPublished: true
    };

    // If userId is provided, filter by that user, otherwise get all videos
    if (userId) {
        matchCondition.owner = new mongoose.Types.ObjectId(userId);
    }

    // Add text search if query is provided
    if (query) {
        matchCondition.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    const pipeline = [
        {
            $match: matchCondition
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
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                [sortBy]: sortType.toLowerCase() === "asc" ? 1 : -1
            }
        },
        {
            $project: {
                likeCount: 1,
                owner: 1,
                views: 1,
                videoFile: 1,
                createdAt: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                isPublished: 1
            }
        }
    ]

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        pagination: true
    }

    const videos = await Video.aggregatePaginate(pipeline, options)

      res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched successfully"
        )
    );
} catch (error) {
    return res
           .status(500)
           .json(new ApiResponse(500, null, "error in db fetching"));
}
    
})

const getUserVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc" } = req.query;
    const userId = req.user?._id;
    
    if (!userId) {
        throw new ApiError(401, "Authentication required");
    }
    
    // Validate sortBy field
    const validSortFields = ["createdAt", "views", "duration", "title"];
    if (!validSortFields.includes(sortBy)) {
        throw new ApiError(400, `Invalid sortBy field. Valid options: ${validSortFields.join(", ")}`);
    }
    
    try {
        // Build match condition for user's videos
        const matchCondition = {
            owner: new mongoose.Types.ObjectId(userId)
            // Include both published and unpublished videos for owner
        };

        // Add text search if query is provided
        if (query) {
            matchCondition.$or = [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } }
            ];
        }

        const pipeline = [
            {
                $match: matchCondition
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
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likeCount: {
                        $size: "$likes"
                    },
                    owner: {
                        $first: "$owner"
                    }
                }
            },
            {
                $sort: {
                    [sortBy]: sortType.toLowerCase() === "asc" ? 1 : -1
                }
            },
            {
                $project: {
                    likeCount: 1,
                    owner: 1,
                    views: 1,
                    videoFile: 1,
                    createdAt: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    isPublished: 1
                }
            }
        ];

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            pagination: true
        };

        const videos = await Video.aggregatePaginate(pipeline, options);

        res.status(200).json(
            new ApiResponse(
                200,
                videos,
                "User videos fetched successfully"
            )
        );
    } catch (error) {
        console.error('Error fetching user videos:', error);
        return res
               .status(500)
               .json(new ApiResponse(500, null, "error in db fetching"));
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title || !description) {
        throw new ApiError(401, "title and description is necessary")
    }
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    const videoFileLocalPath = req.files?.videoFile[0]?.path; 
    if(!videoFileLocalPath){
        throw new ApiError(401, "video is a required field")
    }
    
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    let thumbnail = null;
    if(thumbnailLocalPath){
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
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
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    try {
        const pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId),
                    isPublished: true
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
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likeCount: {
                        $size: "$likes"
                    },
                    owner: {
                        $first: "$owner"
                    }
                }
            },
            {
                $project: {
                    likeCount: 1,
                    owner: 1,
                    views: 1,
                    videoFile: 1,
                    createdAt: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    isPublished: 1
                }
            }
        ];

        const videos = await Video.aggregate(pipeline);
        const video = videos[0];
        
        if(!video) {
            throw new ApiError(404, "Video not found")
        }
        
        return res
               .status(200)
               .json(new ApiResponse(200, video, "video fetched successfully"))
    } catch (error) {
        console.error("Get video by ID error:", error);
        throw new ApiError(500, error.message || "error in db fetching");
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const userId = req.user?._id;
    
    if (!videoId || !title || !description) {
        throw new ApiError(400, "Video ID, title and description are required fields");
    }
    
    if (!userId) {
        throw new ApiError(401, "Authentication required");
    }
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    let thumbnail = null;
    
    if (thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    }

    try {
        // First, find the video and check ownership
        const existingVideo = await Video.findById(videoId);
        
        if (!existingVideo) {
            throw new ApiError(404, "Video not found");
        }
        
        // Check if the current user is the owner of the video
        if (existingVideo.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to update this video. Only the video owner can modify their videos.");
        }
        
        // Prepare update data
        const updateData = {
            title: title,
            description: description,
        };
        
        // Only update thumbnail if a new one was uploaded
        if (thumbnail) {
            updateData.thumbnail = thumbnail.url;
        }
        
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            updateData,
            { new: true }
        );
        
        return res 
                .status(200)
                .json(new ApiResponse(200, updatedVideo, "Video details updated successfully"));
                
    } catch (error) {
        // If it's already an ApiError, re-throw it
        if (error instanceof ApiError) {
            throw error;
        }
        
        console.error('Error updating video:', error);
        throw new ApiError(500, "Failed to update video. Please try again.");
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    if (!userId) {
        throw new ApiError(401, "Authentication required");
    }
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }
    
    try {
        // First, find the video and check if it exists
        const video = await Video.findById(videoId);
        
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
        
        // Check if the current user is the owner of the video
        if (video.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to delete this video. Only the video owner can delete their videos.");
        }
        
        // Delete the video (only if user is the owner)
        await Video.findByIdAndDelete(videoId);
        
        return res 
               .status(200)
               .json(new ApiResponse(200, { deletedVideoId: videoId }, "Video deleted successfully"));
               
    } catch (error) {
        // If it's already an ApiError, re-throw it
        if (error instanceof ApiError) {
            throw error;
        }
        
        console.error('Error deleting video:', error);
        throw new ApiError(500, "Failed to delete video. Please try again.");
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    if (!userId) {
        throw new ApiError(401, "Authentication required");
    }
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }
    
    try {
        const video = await Video.findById(videoId);
        
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
        
        // Check if the current user is the owner of the video
        if (video.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to modify this video. Only the video owner can change publish status.");
        }
        
        // Toggle publish status
        video.isPublished = !video.isPublished;
        await video.save({ validateBeforeSave: false });

        return res
               .status(200)
               .json(new ApiResponse(200, video, `Video ${video.isPublished ? 'published' : 'unpublished'} successfully`));
               
    } catch (error) {
        // If it's already an ApiError, re-throw it
        if (error instanceof ApiError) {
            throw error;
        }
        
        console.error('Error toggling publish status:', error);
        throw new ApiError(500, "Failed to update video status. Please try again.");
    }
})

const incrementVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: {
                views: 1
            }
        },
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video views incremented successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getUserVideos,
    incrementVideoViews
}




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
