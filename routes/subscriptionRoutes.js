import express from "express";
const router = express.Router();
import {
  createComment,
  deleteComment,
  getAllComments,
  updateComment,
  updatePicture,
  getSingle,
} from "../controllers/subscriptionControllers";
import { adminGuard, authGuard } from "../middleware/authMiddleware";

router.route("/").post(authGuard, createComment).get(getAllComments);
router.route("/:id").put(updateComment).delete(authGuard, deleteComment);
router.route("/uploadPic").put(authGuard, updatePicture);
router.route("/getSingle/:userId").get(getSingle);

export default router;
