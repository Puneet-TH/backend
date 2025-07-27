import multer from "multer"
//cb = callback
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // cb(null, file.fieldname + '-' + uniqueSuffix)
     cb(null, file.originalname)
     //use karre h yeh kyuki thodi der hi rehni h derver pe phir upload sidha toh jra time ke liye chyie toh itni complex naming ki jrurat nhi absic is enough 
  }
})

export const upload = multer({storage})