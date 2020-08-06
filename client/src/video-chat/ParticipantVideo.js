import React, { useState, useEffect, useRef, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { UserContext } from "../contexts/UserContext";

const useStyles = makeStyles((theme) => ({
  root: {
    right: 0,
  },
  local: {
    maxWidth: 60,
    right: 0,
    zIndex: 10,
    borderTopRightRadius: "5px",
  },
  remote: {
    maxWidth: 250,
    right: 0,
    zIndex: 5,
    borderRadius: "5px 5px 0px 0px",
    backgroundColor: "#494949",
  },
  names: {
    color: "#ffffff",
    fontWeight: 600,
    padding: 5,
  },
  dot: {
    height: 8,
    width: 8,
    backgroundColor: "#3ed562",
    borderRadius: 4,
    marginBottom: 2,
    display: "inline-block",
  },
}));

const ParticipantVideo = ({ participant, remote, otherUserFirstName }) => {
  const classes = useStyles();
  const [videoTracks, setVideoTracks] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const { user } = useContext(UserContext);

  const videoRef = useRef();
  const audioRef = useRef();

  const trackpubsToTracks = (trackMap) =>
    Array.from(trackMap.values())
      .map((publication) => publication.track)
      .filter((track) => track !== null);

  useEffect(() => {
    setVideoTracks(trackpubsToTracks(participant.videoTracks));
    setAudioTracks(trackpubsToTracks(participant.audioTracks));

    const trackSubscribed = (track) => {
      if (track.kind === "video") {
        setVideoTracks((videoTracks) => [...videoTracks, track]);
      } else if (track.kind === "audio") {
        setAudioTracks((audioTracks) => [...audioTracks, track]);
      }
    };

    const trackUnsubscribed = (track) => {
      if (track.kind === "video") {
        setVideoTracks((videoTracks) => videoTracks.filter((v) => v !== track));
      } else if (track.kind === "audio") {
        setAudioTracks((audioTracks) => audioTracks.filter((a) => a !== track));
      }
    };

    participant.on("trackSubscribed", trackSubscribed);
    participant.on("trackUnsubscribed", trackUnsubscribed);

    return () => {
      setVideoTracks([]);
      setAudioTracks([]);
      participant.removeAllListeners();
    };
  }, [participant]);

  useEffect(() => {
    const videoTrack = videoTracks[0];
    if (videoTrack) {
      videoTrack.attach(videoRef.current);
      return () => {
        videoTrack.detach();
      };
    }
  }, [videoTracks]);

  useEffect(() => {
    const audioTrack = audioTracks[0];
    if (audioTrack) {
      audioTrack.attach(audioRef.current);
      return () => {
        audioTrack.detach();
      };
    }
  }, [audioTracks]);

  return (
    <div className={classes.root}>
      <video
        ref={videoRef}
        autoPlay={true}
        className={`${remote ? classes.remote : classes.local}`}
      />
      <audio ref={audioRef} autoPlay={true} muted={true} />
      {remote && (
        <div className={classes.names}>
          &nbsp;<span className={classes.dot}></span>&nbsp;&nbsp;
          {user.firstName}
          &nbsp;&nbsp;&nbsp;<span className={classes.dot}></span>&nbsp;&nbsp;
          {otherUserFirstName ? otherUserFirstName : ""}
        </div>
      )}
    </div>
  );
};

export default ParticipantVideo;
