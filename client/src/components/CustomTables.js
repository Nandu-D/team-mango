import React, { useState, useContext, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import { useLocation } from "react-router-dom";
import { useHistory } from "react-router-dom";
import Rating from "@material-ui/lab/Rating";
import { ColumnHeading } from "./CustomHeadings";
import { InsideTableButton } from "./CustomButtons";
import socket from "../socket/socket";
import { UserContext } from "../contexts/UserContext";
import QuestionDialog from "../dialogs/QuestionDialog";
import FeedbackDialog from "../dialogs/FeedbackDialog";
const pastPracticeTableStyles = makeStyles({
  root: {
    flexGrow: 1,
  },
  tableHead: {
    backgroundColor: "#516bf6",
  },
});

function formatAMPM(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const amPm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const time = hours + ":" + minutes + " " + amPm;
  return time;
}

function formatDate(unformattedDate) {
  //Format : "Thursday , April 30, 2020"
  const year = unformattedDate.getFullYear();
  const date = unformattedDate.getDate();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthIndex = unformattedDate.getMonth();
  const monthName = months[monthIndex];
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayIndex = unformattedDate.getDay();
  const dayName = days[dayIndex];
  return dayName + " , " + monthName + " " + date + ", " + year;
}

export function PastPracticeTable(props) {
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const classes = pastPracticeTableStyles();
  const location = useLocation();
  const [completedInterviewsList, setCompletedInterviewsList] = useState([]);
  const { user } = useContext(UserContext);
  const [prevInterviewQuetions, setPrevInterviewQuetions] = useState({});
  const [prevFeedback, setPrevFeedback] = useState({});
  useEffect(() => {
    fetch("/interviews/completed")
      .then((result) => result.json())
      .then((data) => {
        data.forEach((element) => {
          const startDate = new Date(element.startTime);
          const endDate = new Date(element.endTime);
          element.heldOnDate = formatDate(startDate);
          element.heldOnTime =
            formatAMPM(startDate) + " - " + formatAMPM(endDate);
          const {
            codingRating,
            communicationRating,
          } = extractCodingAndCommunicationRating(element, user.id);
          element.codingRating = codingRating;
          element.communicationRating = communicationRating;
          setCompletedInterviewsList((prevArray) => [...prevArray, element]);
        });
      })
      .catch((err) => console.error(err));
  }, [location.pathname]);

  const extractCodingAndCommunicationRating = (interview, userId) => {
    let codingRating, communicationRating;
    const participants = interview.participants;
    if (participants) {
      participants.forEach((participant) => {
        if (participant.user && participant.user === userId) {
          if (
            participant.feedbackReceived &&
            participant.feedbackReceived.review
          ) {
            const review = participant.feedbackReceived.review;
            const {
              communicationSkills,
              codeEfficiency,
              codeOrganization,
              debuggingSkills,
              problemSolvingSkills,
              speed,
            } = review;
            communicationRating = convertReviewPointsToScore(
              communicationSkills
            );
            const codeRatingAverage =
              (convertReviewPointsToScore(codeEfficiency) +
                convertReviewPointsToScore(codeOrganization) +
                convertReviewPointsToScore(debuggingSkills) +
                convertReviewPointsToScore(problemSolvingSkills) +
                convertReviewPointsToScore(speed)) /
              5;
            codingRating = codeRatingAverage;
          }
        }
      });
    }
    return {
      codingRating: codingRating,
      communicationRating: communicationRating,
    };
  };

  const convertReviewPointsToScore = (reviewPoint) => {
    switch (reviewPoint) {
      case "needs improvement":
        return 1;
      case "satisfactory":
        return 2;
      case "good":
        return 3;
      case "great":
        return 4;
      case "excellent":
        return 5;
      default:
        return undefined;
    }
  };
  function handleOpenQuestionDialog() {
    setOpenQuestionDialog(true);
  }

  function handleQuestionDialogClose() {
    setOpenQuestionDialog(false);
  }
  function handleOpenFeedbackDialog() {
    setOpenFeedbackDialog(true);
  }

  function handleFeedbackDialogClose() {
    setOpenFeedbackDialog(false);
  }
  function openQuestionDialogClick(id) {
    fetch(`/interviews/questions/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ownQuestion && res.peerQuestion) {
          let answerLink = res.ownQuestion.title.toLowerCase();
          answerLink = answerLink.replace(/^[0-9]+\. */g, "");
          answerLink = answerLink.replace(/ /g, "-");
          res.ownQuestion.description = res.ownQuestion.description.concat(
            `<a target="popup" href="https://leetcode.com/problems/${answerLink}/discuss/"><h3 style ="margin-top: -30px; margin-bottom: 50px;">Answer</h3></a>`
          );
          setPrevInterviewQuetions(res.ownQuestion);
          setOpenQuestionDialog(true);
        }
      });
  }
  function openFeedbackDialogClick(id) {
    fetch(`/interviews/feedback/${id}`)
      .then((res) => res.json())
      .then((res) => {
        setPrevFeedback(res);
        setOpenFeedbackDialog(true);
      });
  }

  function RatingComponent(props) {
    const isRatingProvided = props.isRatingProvided;
    const value = props.value;

    if (isRatingProvided) {
      return <Rating value={value} readOnly />;
    } else {
      return <Typography>N/A</Typography>;
    }
  }

  return (
    <div>
      <QuestionDialog
        open={openQuestionDialog}
        setOpen={setOpenQuestionDialog}
        onClose={handleQuestionDialogClose}
      >
        {prevInterviewQuetions}
      </QuestionDialog>
      <FeedbackDialog
        open={openFeedbackDialog}
        setOpen={setOpenFeedbackDialog}
        onClose={handleFeedbackDialogClose}
      >
        {prevFeedback}
      </FeedbackDialog>
      <Table
        className={classes.root}
        aria-label="Past practice interviews table"
      >
        <TableHead className={classes.tableHead}>
          <TableCell>
            <ColumnHeading text="Held on" />
          </TableCell>
          <TableCell align="center">
            <ColumnHeading text="Coding" />
          </TableCell>
          <TableCell align="center">
            <ColumnHeading text="Communication" />
          </TableCell>
          <TableCell align="center">
            <ColumnHeading text="Questions" />
          </TableCell>
          <TableCell align="center">
            <ColumnHeading text="Detailed Feedback" />
          </TableCell>
        </TableHead>
        <TableBody>
          {completedInterviewsList.map((interview) => (
            <TableRow key={interview._id}>
              <TableCell component="th" scope="row">
                <Grid container direction="column">
                  <Grid item>
                    <Typography>{interview.heldOnDate}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography>{interview.heldOnTime}</Typography>
                  </Grid>
                </Grid>
              </TableCell>
              <TableCell align="center">
                <RatingComponent
                  value={interview.codingRating}
                  isRatingProvided={
                    interview.codingRating && interview.codingRating >= 0
                  }
                />
              </TableCell>
              <TableCell align="center">
                <RatingComponent
                  value={interview.communicationRating}
                  isRatingProvided={
                    interview.communicationRating &&
                    interview.communicationRating >= 0
                  }
                />
              </TableCell>
              <TableCell align="center">
                <InsideTableButton
                  onClick={() => openQuestionDialogClick(interview._id)}
                >
                  Question
                </InsideTableButton>
              </TableCell>
              <TableCell align="center">
                <InsideTableButton
                  onClick={() => openFeedbackDialogClick(interview._id)}
                >
                  Feedback
                </InsideTableButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const upcomingOrOngoingTableStyles = makeStyles({
  root: {
    flexGrow: 1,
  },
  tableHead: {
    backgroundColor: "#516bf6",
  },
});

export function UpcomingOrOngoingTable(props) {
  const classes = upcomingOrOngoingTableStyles();
  const location = useLocation();
  const [ongoingInterviewList, setOngoingInterviewList] = useState([]);
  const { user } = useContext(UserContext);
  const [inCodeList, setinCodeList] = useState([]);
  const history = useHistory();
  function cancelInterview(id) {
    fetch("interviews/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id }),
    })
      .then(() => {
        const arr = [...ongoingInterviewList];
        let index = arr.indexOf(id);
        if (index !== -1) {
          arr.splice(index, 1);
          setOngoingInterviewList([...arr]);
        }
      })
      .catch((err) => console.log(err));
  }
  function joinInterview(id) {
    const info = {};
    info.id = id;
    info.name = user.firstName + " " + user.lastName;
    info.userId = user.id;
    if (inCodeList.indexOf(id) == -1) {
      socket.emit("joinInterviewLobby", info, function (confimation) {});
      history.push(`/dashboard/waitingroom/${id}`);
    } else {
      history.push(`/code/${id}`);
      socket.emit("joinCodeRoom", info, function (confimation) {
        if (!confimation) history.push("/dashboard");
      });
    }
  }
  useEffect(() => {
    fetch("/interviews/ongoing")
      .then((result) => result.json())
      .then((data) => {
        data.forEach((element) => {
          setOngoingInterviewList((prevArray) => [...prevArray, element]);
        });
      })
      .catch((err) => console.error(err));
  }, [location.pathname]);

  useEffect(() => {
    socket.emit("checkInCodeRoom", ongoingInterviewList, function codeList(
      inCode
    ) {
      setinCodeList(inCode);
    });
  }, [ongoingInterviewList]);
  return (
    <Table
      className={classes.root}
      aria-label="Upcoming or Ongoing interviews table"
    >
      <TableHead className={classes.tableHead} align="center">
        <TableCell>
          <ColumnHeading text="Interview ID" />
        </TableCell>
        <TableCell align="center">
          <ColumnHeading text="Join" />
        </TableCell>
        <TableCell align="center">
          <ColumnHeading text="Cancel" />
        </TableCell>
      </TableHead>
      <TableBody>
        {ongoingInterviewList.map((interviewId) => (
          <TableRow key={interviewId}>
            <TableCell component="th" scope="row">
              <Typography>{interviewId}</Typography>
            </TableCell>
            <TableCell align="center">
              <InsideTableButton onClick={() => joinInterview(interviewId)}>
                Join
              </InsideTableButton>
            </TableCell>
            <TableCell align="center">
              {inCodeList.indexOf(interviewId) == -1 ? (
                <InsideTableButton onClick={() => cancelInterview(interviewId)}>
                  Cancel
                </InsideTableButton>
              ) : (
                <></>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
