import { Router } from "express";
import { changeCurrentPassword,
     getCurrentUser, 
     getUserChannelProfile, 
     getWatchHitory, 
     loginUser, 
     logoutUser, 
     refreshAccessToken,
      registerUser, 
      updateAccountDetails, 
      updateUserAvatar, 
      updateUserCoverImage
     } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";
// import { verify } from "jsonwebtoken";

const router = Router()

router.route("/register").post(
    //middleware injected before register user method
    upload.fields([
       {
        name: "avatar",
        maxCount: 1
       }, {
        name: "coverImage",
        maxCount: 1
       }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//public routes
router.route("/c/:username").get(getUserChannelProfile) // Public user profile

//secured routes
router.route("/logout").post( verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage),
router.route("/history").get(verifyJWT, getWatchHitory)

export default router