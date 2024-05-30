import { Schema, model } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    status: { type: String, default: "" },
    photo: { type: String, default: "" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Subscription = model("Subscription", SubscriptionSchema);
export default Subscription;
