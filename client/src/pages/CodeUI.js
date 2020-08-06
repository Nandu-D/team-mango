import React, { useContext, Redirect, useState, useEffect } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import {
  Grid,
  AppBar,
  Button,
  Paper,
  Box,
  Typography,
  Toolbar,
  Select,
  MenuItem,
} from "@material-ui/core/";
import { useHistory } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { withStyles } from "@material-ui/core/styles";
import { sizing } from "@material-ui/system";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import { theme } from "../themes/theme";
import socket from "../socket/socket";
import Video from "twilio-video";
import ParticipantVideo from "../video-chat/ParticipantVideo";
require("codemirror/mode/xml/xml");
require("codemirror/mode/python/python");
require("codemirror/mode/clike/clike");
require("codemirror/mode/javascript/javascript");

const codeUIStyle = (theme) => ({
  root: {
    flexGrow: 1,
  },
  title: {
    padding: "20px 30px 0px 30px",
  },
  questionButtons: {
    width: 80,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#516bf6",
    marginTop: "10px",
  },
  questionButtonsText: {
    fontSize: 11,
    color: "white",
    fontWeight: 600,
  },
  containerGrid: {
    marginTop: theme.spacing(-1),
  },
  itemGrid: {
    marginTop: theme.spacing(-0.5),
  },
  question: {
    overflow: "auto",
    padding: "5px 30px 0px",
    fontFamily: '"Open Sans", "Roboto"',
  },

  select: {
    marginBottom: "10px",
    color: "white",
    [theme.breakpoints.down("xs")]: {
      color: "black",
      "&:before": {
        borderColor: "black",
      },
      "&:after": {
        borderColor: "black",
      },
    },
    "&:before": {
      borderColor: "white",
    },
    "&:after": {
      borderColor: "white",
    },
  },
  icon: {
    fill: "white",
    [theme.breakpoints.down("xs")]: {
      fill: "black",
    },
  },
  videoContainer: {
    right: 10,
    top: 20,
    position: "relative",
    backgroundColor: "#494949",
  },
  remoteParticipant: {
    position: "absolute",
    margin: "0 auto",
    right: 0,
    borderRadius: "5px",
    backgroundColor: "#494949",
    zIndex: 5,
    [theme.breakpoints.down("xs")]: {
      maxWidth: 400,
      position: "static !important",
    },
  },
  localParticipant: {
    position: "absolute",
    right: 0,
    marginTop: "auto",
    borderTopRightRadius: "5px",
    zIndex: 9,
    [theme.breakpoints.down("xs")]: {
      maxWidth: 400,
      position: "static !important",
    },
  },
});

function CodeUI(props) {
  const { user } = useContext(UserContext);
  const [code, setCode] = useState(null);
  const [interview, setInterview] = useState(" ");
  const [otherUserFirstName, setOtherUserFirstName] = useState("");
  const [runResult, setrunResult] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  const [ownQuestion, setOwnQuestion] = useState(" ");
  const [buttonDisable, setButtonDisable] = useState(true);
  const [showingQuestion, setShowingQuestion] = useState(" ");
  const [peerQuestion, setPeerQuestion] = useState(" ");
  const history = useHistory();
  const [videoRoom, setVideoRoom] = useState(null);
  const [videoParticipants, setVideoParticipants] = useState([]);
  const [token, setToken] = useState(null);

  const [language, setLanguage] = useState("text/x-python");

  useEffect(() => {
    fetch(`/interviews/questions/${props.match.params.id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ownQuestion && res.peerQuestion) {
          res.ownQuestion.description = res.ownQuestion.description.replace(
            /^(<br>)/,
            ""
          );
          res.peerQuestion.description = res.peerQuestion.description.replace(
            /^(<br>)/,
            ""
          );

          setOwnQuestion(res.ownQuestion);
          setShowingQuestion(res.ownQuestion);
          let answerLink = res.peerQuestion.title.toLowerCase();
          answerLink = answerLink.replace(/^[0-9]+\. */g, "");
          answerLink = answerLink.replace(/ /g, "-");
          res.peerQuestion.description = res.peerQuestion.description.concat(
            `<a target="popup" href="https://leetcode.com/problems/${answerLink}/discuss/"><h3 style ="margin-top: -30px; margin-bottom: 50px;">Answer</h3></a>`
          );
          setPeerQuestion(res.peerQuestion);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  function handleQuestionChange() {
    if (showingQuestion === ownQuestion) {
      setButtonDisable(false);
      setShowingQuestion(peerQuestion);
    } else {
      setButtonDisable(true);
      setShowingQuestion(ownQuestion);
    }
  }

  useEffect(() => {
    handleInRoom();
    if (user) {
      socket.emit(
        "joinCodeRoom",
        {
          id: props.match.params.id,
          name: user.firstName + " " + user.lastName,
          userId: user.id,
        },
        function (confimation, otherUser) {
          if (!confimation) history.push("/dashboard");
          else {
            const fullNameSplit = otherUser.name.split(" ");
            setOtherUserFirstName(fullNameSplit[0]);
            setInterview(`Interview with ${otherUser.name}`);
          }
        }
      );
    }
  }, [user]);

  useEffect(() => {
    socket.on("update_code", (info) => {
      setCode(info.code);
    });
    socket.on("toReview", (info) => {
      /*Route to review*/
      history.push(`/dashboard/${props.match.params.id}/feedback/1`);
    });
    socket.on("runResults", (res) => {
      setrunResult(res);
    });
  }, []);

  //For video chat room creation
  useEffect(() => {
    fetch(`/video/token/${props.match.params.id}`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => setToken(data.token));
  }, []);

  //For video chat connection
  useEffect(() => {
    if (token) {
      const participantConnected = (participant) => {
        setVideoParticipants((prevParticipants) => [
          ...prevParticipants,
          participant,
        ]);
      };

      const participantDisconnected = (participant) => {
        setVideoParticipants((prevParticipants) =>
          prevParticipants.filter((p) => p !== participant)
        );
      };

      Video.connect(token, {
        name: props.match.params.id,
      }).then((videoRoom) => {
        setVideoRoom(videoRoom);
        videoRoom.on("participantConnected", participantConnected);
        videoRoom.on("participantDisconnected", participantDisconnected);
        videoRoom.participants.forEach(participantConnected);
      });

      return () => {
        setVideoRoom((currentRoom) => {
          if (
            currentRoom &&
            currentRoom.localParticipant.state === "connected"
          ) {
            currentRoom.localParticipant.tracks.forEach(function (
              trackPublication
            ) {
              trackPublication.track.stop();
            });
            currentRoom.disconnect();
            return null;
          } else {
            return currentRoom;
          }
        });
      };
    }
  }, [props.match.params.id, token]);

  //For video chat other participant video
  const remoteParticipants = videoParticipants.map((participant) => (
    <ParticipantVideo
      key={participant.sid}
      participant={participant}
      remote={true}
      otherUserFirstName={otherUserFirstName}
    />
  ));

  const handleInRoom = () => {
    inRoom ? setInRoom(false) : setInRoom(true);
  };

  const updateCode = (newCode) => {
    socket.emit("new_code", {
      id: props.match.params.id,
      name: user.firstName + " " + user.lastName,
      userId: user.id,
      code: newCode,
    });
  };
  async function runCode() {
    let runingCode = {
      code: code,
      language: language,
      id: props.match.params.id,
    };
    socket.emit("runCode", runingCode);
  }
  function endInterview() {
    fetch(`/interviews/endInterview/${props.match.params.id}`)
      .then((res) => socket.emit("endInterview", { id: props.match.params.id }))
      .catch((err) => console.log(err));
    setToken(null); //For video-chat logout
  }

  const changeLanguage = (lang) => {
    setLanguage(lang.target.value);
  };

  const { classes } = props;
  return (
    <div className={classes.root}>
      <Grid container spacing={1} className={classes.containerGrid}>
        <Grid item xs={12}>
          <AppBar position="static" color="primary">
            <Toolbar variant="dense">
              <Typography color="white" variant="h5" style={{ flex: 1 }}>
                {interview}
              </Typography>

              <Button color="inherit" variant="outlined" onClick={endInterview}>
                End Interview
              </Button>
            </Toolbar>
          </AppBar>
        </Grid>
      </Grid>
      <div className={classes.videoContainer}>
        <div className={classes.localParticipant}>
          {videoRoom ? (
            <ParticipantVideo
              key={videoRoom.localParticipant.sid}
              participant={videoRoom.localParticipant}
              remote={false}
            />
          ) : (
            ""
          )}
        </div>
        <div className={classes.remoteParticipant}>{remoteParticipants}</div>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} className={classes.itemGrid}>
          <Box style={{ height: "800px" }}>
            <Grid container spacing={5} alignItems="center" justify="center">
              <Grid item xs={0}>
                <Button
                  className={classes.questionButtons}
                  onClick={handleQuestionChange}
                  disabled={buttonDisable}
                >
                  <Typography className={classes.questionButtonsText}>
                    My Question
                  </Typography>
                </Button>
              </Grid>
              <Grid item xs={0}>
                <Button
                  className={classes.questionButtons}
                  onClick={handleQuestionChange}
                  disabled={!buttonDisable}
                >
                  <Typography className={classes.questionButtonsText}>
                    Peer Question
                  </Typography>
                </Button>
              </Grid>
            </Grid>
            <Typography
              className={classes.title}
              color="primary"
              variant="h5"
              backgroundColor="white"
            >
              {showingQuestion.title}
            </Typography>
            <div
              className={classes.desc}
              style={{
                height: "720px",
                ".br": "display:block; margin-bottom: 0em",
              }}
              dangerouslySetInnerHTML={{
                __html: showingQuestion.description,
              }}
              className={classes.question}
            ></div>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          className={classes.itemGrid}
          style={{ marginTop: "-43px" }}
        >
          <Select
            value={language}
            onChange={changeLanguage}
            className={classes.select}
            inputProps={{
              classes: {
                icon: classes.icon,
              },
            }}
          >
            <MenuItem value={"text/x-python"}>Python</MenuItem>
            <MenuItem value={"text/x-java"}>Java</MenuItem>
            <MenuItem value={"text/javascript"}>Javascript</MenuItem>
            <MenuItem value={"text/x-csrc"}>C</MenuItem>
            <MenuItem value={"text/x-c++src"}>C++</MenuItem>
          </Select>
          <CodeMirror
            value={code}
            options={{
              mode: language,
              theme: "material",
              lineNumbers: true,
            }}
            onBeforeChange={(editor, data, value) => {
              updateCode(value);
              setCode(value);
            }}
            onChange={(editor, data, value) => {}}
            style={{ position: "absolute" }}
          />
          <Box bgcolor="#263238" height="210px">
            <AppBar position="static" color="primary">
              <Toolbar variant="dense">
                <Typography color="white" style={{ flex: 1 }}>
                  Console
                </Typography>
                <Button color="inherit" variant="outlined" onClick={runCode}>
                  Run Code
                </Button>
              </Toolbar>
            </AppBar>
            <Box color="white" p={3}>
              {runResult}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </div>
  );
}

export default withStyles(codeUIStyle)(CodeUI);
