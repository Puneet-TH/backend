import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema(
    {   //the one who is subscribing
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        //to whom subscriber subscribed
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, {timestamps: true})

export const Subscription = mongoose.model('Subscription', subscriptionSchema)