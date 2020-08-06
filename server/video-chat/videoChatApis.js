const express = require("express");
const router = express.Router();
const { videoToken } = require('./twilioTokens');
const verifyToken = require("../helpers/verifyToken");

const sendTokenResponse = (token, res) => {
    res.set('Content-Type', 'application/json');
    res.send(
      JSON.stringify({
        token: token.toJwt()
      })
    );
  };

router.get('/token/:interviewId', verifyToken, (req, res) => {
    const user = req.user;
    const interviewId = req.params.interviewId;
    const identity = user.id;
    const room = interviewId;
    const token = videoToken(identity, room);
    sendTokenResponse(token, res);
  });
  
router.post('/token/:interviewId', verifyToken, (req, res) => {
    const user = req.user;
    const interviewId = req.params.interviewId;
    const identity = user.id;
    const room = interviewId;
    const token = videoToken(identity, room);
    sendTokenResponse(token, res);
  });

  module.exports = router;