import { Router } from "express";
import { changeCurrentPassword,
     getCurrentUser, 
     getUserChannelProfile, 
     getWatchHitory, 
     loginUser, 
     logoutUser, 
     refreshAcessToken,
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

//secured routes
router.route("/logout").post( verifyJWT, logoutUser)
router.route("/refresh-Token").post(refreshAcessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage),
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHitory)

export default router