import { uploadPicture } from "../middleware/uploadPictureMiddleware";
import SubscriptionModel from "../models/Subscription";
import UserModel from "../models/User";

const createComment = async (req, res, next) => {
  try {
    const user = req.user._id;

    if (!user) {
      return
    }

    const post = await SubscriptionModel.findOne({ user: user });
    if (post) {
      const error = new Error("Already Requested");
      return next(error);
    }
    const newdata = new SubscriptionModel({
      user: req.user._id,
      status: "requested",
    });
    const requesterUser = await UserModel.findById(req.user._id);
    requesterUser.subscription = newdata._id;
    await requesterUser.save();
    const savedComment = await newdata.save();
    return res.json(savedComment);
  } catch (error) {
    next(error);
  }
};
const getSingle = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const post = await SubscriptionModel.findOne({ user: userId });
    if (post) {
      return res.json(post);
    } else {
      const newdata = new SubscriptionModel({
        user: userId,
        status: "requested",
      });
      const requesterUser = await UserModel.findById(userId);
      requesterUser.subscription = newdata._id;
      await requesterUser.save();
      const savedComment = await newdata.save();
      return res.json(savedComment);
    }
  } catch (error) {
    console.log("error", error);

    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const singleData = await SubscriptionModel.findById(req.params.id);

    if (!singleData) {
      const error = new Error("data was not found");
      return next(error);
    }

    const upload = uploadPicture.single("postPicture");

    upload(req, res, async function (err) {
      if (err) {
        const error = new Error(
          "An unknown error occured when uploading " + err.message
        );
        next(error);
      } else {
        // every thing went well
        if (req.file) {
          singleData.photo = req.file.filename;
          const updatedPost = await singleData.save();
          return res.json(updatedPost);
        } else {
          const { status } = JSON.parse(req.body.document);
          singleData.status = status || singleData.status;
          const updatedPost = await singleData.save();
          return res.json(updatedPost);
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updatePicture = async (req, res, next) => {
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
          let updatedUser = await SubscriptionModel.findOne({
            user: req.user._id,
          });
          filename = updatedUser.photo;
          if (filename) {
            fileRemover(filename);
          }
          updatedUser.photo = req.file.filename;
          await updatedUser.save();
          res.json(updatedUser);
        } else {
          res.json({});
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await SubscriptionModel.findByIdAndDelete(
      req.params.commentId
    );
    await SubscriptionModel.deleteMany({ parent: comment._id });

    if (!comment) {
      const error = new Error("Comment was not found");
      return next(error);
    }

    return res.json({
      message: "Comment is deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getAllComments = async (req, res, next) => {
  try {
    const filter = req.query.searchKeyword;
    let where = {};
    if (filter) {
      where.status = { $regex: filter, $options: "i" };
    }
    let query = SubscriptionModel.find(where);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * pageSize;
    const total = await SubscriptionModel.find(where).countDocuments();
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
      .populate("user");

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export {
  createComment,
  updateComment,
  deleteComment,
  getAllComments,
  updatePicture,
  getSingle,
};
