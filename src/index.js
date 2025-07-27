// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config(
    {path: './env'}
)

const Port = process.env.PORT || 8000; 

connectDB()
.then(() =>{
    app.listen(Port, () => {
        console.log(`server is running at port : ${Port}`)
    })
})
.catch((err) => {
    console.log("MONGO DB CONNECTION FAILED !!", err);
})
/*
IIFE" stands for Immediately Invoked Function Expression
;(async() => {
    try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    } catch (error) {
        console.log("ERROR", error)
        throw error
    }
})()*/
