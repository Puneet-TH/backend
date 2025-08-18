import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

// Public routes
router.route("/:videoId").get(getVideoComments); // Get comments - public

// Protected routes
router.route("/:videoId").post(verifyJWT, addComment); // Add comment - requires auth
router.route("/c/:commentId")
  .delete(verifyJWT, deleteComment) // Delete comment - requires auth
  .patch(verifyJWT, updateComment); // Update comment - requires auth

export default router