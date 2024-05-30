import { Schema, model } from "mongoose";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";

const UserSchema = new Schema(
  {
    avatar: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    chatId: { type: String, default: "" },
    verified: { type: Boolean, default: true },
    verificationCode: { type: String, default: "" },
    admin: { type: Boolean, default: false },
    doctor: { type: Boolean, default: false },
    manager: { type: Boolean, default: false },
    online: { type: Boolean, default: false },

    about: { type: String, default: "" },
    caption: { type: String, default: "" },
    subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },

    tags: { type: [String] },
    categories: [{ type: Schema.Types.ObjectId, ref: "PostCategories" }],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hash(this.password, 10);
    return next();
  }
  return next();
});

UserSchema.methods.generateJWT = async function () {
  return await sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await compare(enteredPassword, this.password);
};

const User = model("User", UserSchema);
export default User;
