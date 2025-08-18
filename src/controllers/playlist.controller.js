import mongoose, {isValidObjectId} from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
     if(!name || !description) {
        throw new ApiError(401, "name and description is mandatory")
     }
  try {
      // Create a new playlist instead of using upsert
      const createdPlaylist = await Playlist.create({
          name: name,
          description: description,
          owner: req.user?._id,
          video: [] // Initialize with empty video array (matches model field name)
      });
      
      return res
             .status(201)
             .json(new ApiResponse(201, createdPlaylist, "playlist created successfully"))
               
  } catch (error) {
       console.error("Create playlist error:", error);
       throw new ApiError(500, error ? error.message : "unable to create playlist internal server error")
  }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)) {
        throw new ApiError(401, "wrong format of Id")
    }

   try {
     const userPlaylists = await Playlist.find({owner : userId});
     return res
            .status(200)
            .json(new ApiResponse(200, userPlaylists, "user playlist fetched succesfully"))
   } catch (error) {
       throw new ApiError(502, error ? error : "internal server error")
   }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(401, "wrong format of Id")
    }

   try {
     const userPlaylist = await Playlist.findById(playlistId);
     return res
            .status(200)
            .json(new ApiResponse(200, userPlaylist, "playlist fetched succesfully"))
   } catch (error) {
       throw new ApiError(502, error ? error : "internal server error")
   }
})
//$push to add elements in array 
//$pull to remove elements from array
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(401, "first create a playlist")
    }
    
     const addVideosToPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $push : {
            video : videoId
        }
     }, {new: true})

     return res
            .status(200)
            .json(new ApiResponse(200, addVideosToPlaylist, "video added to Playlist successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(401, "first create a playlist")
    }
    
     const removedVideosToPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $pull : {
            video : videoId
        }
     }, {new: true})

     return res
            .status(200)
            .json(new ApiResponse(200, removedVideosToPlaylist, "video removed to Playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(401, "playlist id format is not correct")
    }

    try {
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
        return res 
                .status(200)
                .json(new ApiError(200 , deletePlaylist, "playlist deleted successfully"))
    } 
    catch (error) {
        throw new ApiError(401, error ? error : "error in fetching from db")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(401, "this is not a valid format ")
    }
    
    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
            $set: {
                name : name,
                description: description
            }
        }, {new : true})
        
        return res
                .status(200)
                .json(new ApiResponse(200, updatedPlaylist, "playlist updated sucessfully"))
    } 
    catch (error) {
         throw new ApiError(500, error? error : "error in fetching from db")
    }

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
