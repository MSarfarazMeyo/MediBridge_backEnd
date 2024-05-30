import express from "express";
const router = express.Router();
import {
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
} from "../controllers/userControllers";
import { adminGuard, authGuard } from "../middleware/authMiddleware";

router.post("/register", registerUser);
router.post("/create", CreateNull);

router.post("/login", loginUser);
router.get("/profile", authGuard, userProfile);
router.get("/dashboard", getDashboardData);

router.put("/updateProfile/:userId", authGuard, updateProfile);

router.put("/updateUser/:userId", authGuard, adminGuard, updateUser);

router.get("/getSingle/:userId", getSingleProfile);

router.put("/updateProfilePicture", authGuard, updateProfilePicture);
router.get("/", getAllUsers);
router.delete("/:userId", authGuard, adminGuard, deleteUser);

export default router;
