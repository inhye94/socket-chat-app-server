import express from "express";
const router = express.Router();

// 서버 라우터 설정
router.get("/", (req, res) => {
  res.send("server is up and running");
});

export default router;
