import { loginUser } from "../controllers/userController.js";
import { updateProfile } from "../controllers/userController.js";
import { updatePassword } from "../controllers/userController.js";
import { getCurrentUser } from "../controllers/userController.js";
import { registerUser } from "../controllers/userController.js";
import express from "express";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

//PUBLIC LINKS
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

//PRIVATE LINKS protect also
userRouter.get("/me", authMiddleware, getCurrentUser);
userRouter.put("/profile", authMiddleware, updateProfile);
userRouter.put("/password", authMiddleware, updatePassword);

export default userRouter;
