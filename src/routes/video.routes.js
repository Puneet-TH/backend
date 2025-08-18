import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    getUserVideos,
    incrementVideoViews,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// Public routes (no authentication required)
router.route("/").get(getAllVideos); // Get all videos - public
router.route("/:videoId").get(getVideoById); // Get single video - public
router.route("/:videoId/views").patch(incrementVideoViews); // Increment video views - public

// Protected routes (authentication required)
router.route("/user/me").get(verifyJWT, getUserVideos); // Get current user's videos
router.route("/").post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
        
    ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router