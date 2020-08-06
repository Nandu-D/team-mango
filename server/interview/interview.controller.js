const express = require("express");
const router = express.Router();

const verifyToken = require("../helpers/verifyToken");
const interviewService = require("./interview.service");
const { NotExtended } = require("http-errors");
const questionService = require("../question/question.service");
//Create interview
router.post("/", verifyToken, async function (req, res) {
  const postBody = req.body;
  const user = req.user;
  const difficulty = postBody.difficulty;

  await interviewService
    .createInterview(user, difficulty)
    .then((interview) => {
      res.status(200).json(interview);
    })
    .catch((err) => {
      res.status(500).json({ Error: err.message });
    });
});

//Remove Interview
router.post("/remove", verifyToken, async function (req, res) {
  const removeID = req.body.id;
  const userID = req.user._id;
  await interviewService
    .removeInterview(userID, removeID)
    .then((response) => res.status(200).json("deleted"))
    .catch((err) => res.status(401).json(err));
});

//Check if the user is the owner
router.get("/isowner/:id", verifyToken, async function (req, res) {
  const userID = req.user._id;
  const interviewID = req.params.id;

  await interviewService
    .getInterview(interviewID)
    .then((interview) => {
      if (interview) {
        if (userID.toString() === interview.owner.toString())
          res.status(200).json("true");
      } else res.status(200).json("false");
    })
    .catch((err) => {
      console.log(err);
      res.status(401).json(err);
    });
});

//Update interview
router.put("/:id", verifyToken, async function (req, res) {
  const postBody = req.body;
  const userId = postBody.participantID;
  let interviewId = req.params.id;

  await interviewService
    .addParticipantToAnInterview(userId, interviewId)
    .then((interview) => {
      res.status(200).json(interview);
    })
    .catch((err) => res.status(500).json({ Error: err.message }));
});

//Get all completed interviews
router.get("/completed", verifyToken, async function (req, res) {
  const user = req.user;
  await interviewService
    .getAllCompletedInterviewsOfAUser(user)
    .then((interviews) => res.status(200).json(interviews))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err.message)
    });
});

//Get all ongoing or upcoming interviews
router.get("/ongoing", verifyToken, async function (req, res) {
  const user = req.user;
  await interviewService
    .getAllOngoingOrUpcomingInterviewsOfAUser(user)
    .then((interviews) => res.status(200).json(interviews))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err.message)
    });
});
//Check if the interview lobby exists
router.get("/exists/:id", verifyToken, async function (req, res) {
  const userID = req.user._id;
  const interviewId = req.params.id;

  await interviewService
    .getInterview(interviewId)
    .then((interview) => {
      if (interview && !interview.startTime) {
        res.status(200).json("true");
      } else res.status(200).json("false");
    })
    .catch(() => res.status(200).json("false"));
});
//End Interview
router.get("/endInterview/:id", verifyToken, async function (req, res) {
  const userID = req.user._id;
  const interviewId = req.params.id;

  await interviewService
    .endInterview(interviewId)
    .then((interview) => {
      if (interview) {
        res.status(200).json("true");
      } else res.status(200).json("false");
    })
    .catch((err) => res.status(500).json(err.message));
});

//Get feedback of a user
router.get("/feedback/:interviewId", verifyToken, async function (req, res) {
  const user = req.user;
  const interviewId = req.params.interviewId;

  await interviewService
    .getFeedbackReceived(user._id, interviewId)
    .then((feedback) => res.status(200).json(feedback))
    .catch((err) => res.status(500).json({ Error: err.message }));
});

//Create feedback for the other user
router.post("/feedback/:interviewId", verifyToken, async function (req, res) {
  const postBody = req.body;
  const user = req.user;
  const userId = user._id;
  const interviewId = req.params.interviewId;

  await interviewService
    .createFeedback(userId, interviewId, postBody)
    .then((feedback) => res.status(200).json(feedback))
    .catch((err) => res.status(500).json({ Error: err.message }));
});

//Get feedback given to the other participant in a given interview
router.get("/feedback/:interviewId/given", verifyToken, async function (
  req,
  res
) {
  const user = req.user;
  const interviewId = req.params.interviewId;

  await interviewService
    .getFeedbackGiven(user._id, interviewId)
    .then((feedback) => res.status(200).json(feedback))
    .catch((err) => res.status(500).json({ Error: err.message }));
});

//Get Questions
router.get("/questions/:interviewId", verifyToken, async function (req, res) {
  const userId = req.user._id;
  const interviewId = req.params.interviewId;
  let ownQuestionId = "";
  let peerQuestionId = "";

  const interview = await interviewService.getInterview(interviewId);
  await interview.participants.forEach((participant) => {
    if (participant.user.toString() === userId.toString()) {
      ownQuestionId = participant.question;
    } else {
      peerQuestionId = participant.question;
    }
  });

  const ownQuestion = await questionService
    .getQuestionById(ownQuestionId)
    .catch((err) => res.status(500).json(err));
  const peerQuestion = await questionService
    .getQuestionById(peerQuestionId)
    .catch((err) => res.status(500).json(err));
  if (peerQuestion && ownQuestion)
    res
      .status(200)
      .json({ peerQuestion: peerQuestion, ownQuestion: ownQuestion });
});

module.exports = router;
