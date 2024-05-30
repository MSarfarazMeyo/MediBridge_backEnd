import { uploadPicture } from "../middleware/uploadPictureMiddleware";
import Comment from "../models/Comment";
import Post from "../models/Post";
import User from "../models/User";
import PostCategories from "../models/PostCategories";
import Subscription from "../models/Subscription";

import { fileRemover } from "../utils/fileRemover";

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, connectCubeId } = req.body;

    // check whether the user exists or not
    let user = await User.findOne({ email });

    if (user) {
      throw new Error("User have already registered");
    }

    // creating a new user
    user = await User.create({
      name,
      email,
      password,
      verified: true,
      chatId: connectCubeId,
    });

    return res.status(201).json({
      _id: user._id,
      avatar: user.avatar,
      name: user.name,
      email: user.email,
      verified: user.verified,
      admin: user.admin,
      token: await user.generateJWT(),
      chatId: user.chatId,
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email }).populate("subscription");

    if (!user) {
      throw new Error("Email not found");
    }

    if (await user.comparePassword(password)) {
      return res.status(201).json({
        _id: user._id,
        avatar: user.avatar,
        name: user.name,
        email: user.email,
        verified: user.verified,
        admin: user.admin,
        manager: user.manager,
        doctor: user.doctor,
        online: user.online,
        chatId: user.chatId,
        token: await user.generateJWT(),
      });
    } else {
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    next(error);
  }
};

const userProfile = async (req, res, next) => {
  try {
    let user = await User.findById(req.user._id).populate("subscription");

    if (user) {
      return res.status(201).json({
        _id: user._id,
        avatar: user.avatar,
        name: user.name,
        email: user.email,
        verified: user.verified,
        admin: user.admin,
        manager: user.manager,
        doctor: user.doctor,
        online: user.online,
        chatId: user.chatId,
      });
    } else {
      let error = new Error("User not found");
      error.statusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userIdToUpdate = req.params.userId;

    let userId = req.user._id;

    console.log("userId", userId);
    console.log("userIdToUpdate", userIdToUpdate);

    let user = await User.findById(userIdToUpdate).populate("subscription");

    if (!user) {
      throw new Error("User not found");
    }

    if (typeof req.body.admin !== "undefined" && req.user.admin) {
      user.admin = req.body.admin;
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.online = req.body.online || user.online;

    if (req.body.password && req.body.password.length < 6) {
      throw new Error("Password length must be at least 6 character");
    } else if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUserProfile = await user.save();

    res.json({
      _id: updatedUserProfile._id,
      avatar: updatedUserProfile.avatar,
      name: updatedUserProfile.name,
      email: updatedUserProfile.email,
      verified: updatedUserProfile.verified,
      admin: updatedUserProfile.admin,
      manager: updatedUserProfile.manager,
      doctor: updatedUserProfile.doctor,
      online: updatedUserProfile.online,

      token: await updatedUserProfile.generateJWT(),
    });
  } catch (error) {
    next(error);
  }
};
const getSingleProfile = async (req, res, next) => {
  try {
    const userIdToUpdate = req.params.userId;
    let user = await User.findById(userIdToUpdate).populate("subscription");

    if (user) {
      return res.status(201).json(user);
    } else {
      let error = new Error("User not found");
      error.statusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

const updateProfilePicture = async (req, res, next) => {
  try {
    const upload = uploadPicture.single("profilePicture");

    upload(req, res, async function (err) {
      if (err) {
        const error = new Error(
          "An unknown error occured when uploading " + err.message
        );
        next(error);
      } else {
        // every thing went well
        if (req.file) {
          let filename;
          let updatedUser = await User.findById(req.user._id).populate(
            "subscription"
          );
          filename = updatedUser.avatar;
          if (filename) {
            fileRemover(filename);
          }
          updatedUser.avatar = req.file.filename;
          await updatedUser.save();
          res.json({
            _id: updatedUser._id,
            avatar: updatedUser.avatar,
            name: updatedUser.name,
            email: updatedUser.email,
            verified: updatedUser.verified,
            admin: updatedUser.admin,
            online: updatedUser.online,
            manager: updatedUser.manager,
            doctor: updatedUser.doctor,
            chatId: updatedUser.chatId,
            token: await updatedUser.generateJWT(),
          });
        } else {
          let filename;
          let updatedUser = await User.findById(req.user._id);
          filename = updatedUser.avatar;
          updatedUser.avatar = "";
          await updatedUser.save();
          fileRemover(filename);
          res.json({
            _id: updatedUser._id,
            avatar: updatedUser.avatar,
            name: updatedUser.name,
            email: updatedUser.email,
            verified: updatedUser.verified,
            admin: updatedUser.admin,
            manager: updatedUser.manager,
            doctor: updatedUser.doctor,
            online: updatedUser.online,

            token: await updatedUser.generateJWT(),
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const filter = req.query.searchKeyword;
    const role = req.query.role;
    let where = { verified: true };
    if (filter) {
      where.email = { $regex: filter, $options: "i" };
    }

    if (role == "doctor") {
      where.doctor = true;
    }
    if (role == "manager") {
      where.manager = true;
    }

    let query = User.find(where).populate("subscription");
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * pageSize;
    const total = await User.find(where).countDocuments();
    const pages = Math.ceil(total / pageSize);

    res.header({
      "x-filter": filter,
      "x-totalcount": JSON.stringify(total),
      "x-currentpage": JSON.stringify(page),
      "x-pagesize": JSON.stringify(pageSize),
      "x-totalpagecount": JSON.stringify(pages),
    });

    if (page > pages) {
      return res.json([]);
    }

    const result = await query
      .skip(skip)
      .limit(pageSize)
      .sort({ updatedAt: "desc" })
      .populate("categories");

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getDashboardData = async (req, res, next) => {
  try {
    const users = await User.countDocuments({});
    const doctors = await User.countDocuments({ doctor: true });
    const managers = await User.countDocuments({ manager: true });
    const posts = await Post.countDocuments({});
    const RequestedUsers = await Subscription.countDocuments({
      status: "approved",
    });
    const subscribedUsed = await Subscription.countDocuments({
      status: "requested",
    });

    const data = {
      users: users,
      doctors: doctors,
      managers: managers,
      posts: posts,
      registerUser: RequestedUsers,
      subscribedUsed: subscribedUsed,
    };

    return res.json(data);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.userId);

    if (!user) {
      throw new Error("User no found");
    }

    const postsToDelete = await Post.find({ user: user._id });
    const postIdsToDelete = postsToDelete.map((post) => post._id);

    await Comment.deleteMany({
      post: { $in: postIdsToDelete },
    });

    await Post.deleteMany({
      _id: { $in: postIdsToDelete },
    });

    postsToDelete.forEach((post) => {
      fileRemover(post.photo);
    });

    await user.remove();
    fileRemover(user.avatar);

    res.status(204).json({ message: "User is deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const CreateNull = async (req, res, next) => {
  try {
    const admin = false;

    // creating a new user
    const user = await User.create({
      admin,
    });

    user.email = user._id;
    await user.save();

    return res.status(201).json({
      _id: user._id,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const post = await User.findOne({ _id: req.params.userId }).populate(
      "subscription"
    );

    if (!post) {
      const error = new Error("Doctor aws not found");
      next(error);
      return;
    }

    const upload = uploadPicture.single("postPicture");

    const handleUpdatePostData = async (data) => {
      const {
        title,
        caption,
        slug,
        body,
        tags,
        categories,
        manager,
        admin,
        doctor,
        chatId,
      } = JSON.parse(data);

      post.name = title || post.name;
      post.caption = caption || post.caption;
      post.email = slug || post.email;
      post.about = body || post.about;
      post.tags = tags || post.tags;
      post.categories = categories || post.categories;
      post.doctor = doctor || post.doctor;
      post.admin = admin || post.admin;
      post.manager = manager || post.manager;
      post.password = slug || post.email;

      post.chatId = chatId || post.chatId;

      post.verified = true;

      const updatedPost = await post.save();
      return res.json(updatedPost);
    };

    upload(req, res, async function (err) {
      if (err) {
        const error = new Error(
          "An unknown error occured when uploading " + err.message
        );
        next(error);
      } else {
        // every thing went well
        if (req.file) {
          let filename;
          filename = post.avatar;
          if (filename) {
            fileRemover(filename);
          }
          post.avatar = req.file.filename;
          handleUpdatePostData(req.body.document);
        } else {
          let filename;
          filename = post.avatar;
          post.avatar = "";
          fileRemover(filename);
          handleUpdatePostData(req.body.document);
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export {
  registerUser,
  loginUser,
  userProfile,
  updateProfile,
  updateProfilePicture,
  getAllUsers,
  deleteUser,
  CreateNull,
  getSingleProfile,
  updateUser,
  getDashboardData,
};
