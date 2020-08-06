import React from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogActions from "@material-ui/core/DialogActions";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";

const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
    justifyContent: "flex-end",
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

export const DialogTitle = withStyles(styles)((props) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle className={classes.root} {...other}>
      {onClose ? (
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

export const DialogContent = withStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(8),
    paddingRight: theme.spacing(8),
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}))(MuiDialogContent);

export const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    justifyContent: "center",
  },
}))(MuiDialogActions);

const questionTextAndNoStyles = makeStyles((theme) => ({
  heading: {
    fontSize: 30,
    fontWeight: 400,
    color: "#516bf6",
    marginBottom: theme.spacing(2),
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 400,
    color: "#5e6676",
    fontStyle: "italic",
    marginBottom: theme.spacing(4),
  },
  questionNoStart: {
    fontSize: 16,
    fontWeight: 600,
    color: "#516bf6",
  },
  questionNoNumber1: {
    fontSize: 22,
    fontWeight: 600,
    color: "#516bf6",
  },
  questionNoEnd: {
    fontSize: 16,
    fontWeight: 600,
    color: "#5e6676",
  },
  question: {
    fontSize: 14,
    fontWeight: 600,
    color: "#5e6676",
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(2),
  },
}));

export const QuestionTextAndNo = ({ questionNo, questionText }) => {
  const classes = questionTextAndNoStyles();

  return (
    <>
      <Typography className={classes.heading} align="center">
        Give us your Feedback
      </Typography>
      <Typography gutterBottom className={classes.subHeading} align="center">
        Please leave your comments here:
      </Typography>
      <Typography
        gutterBottom
        display="inline"
        className={classes.questionNoStart}
      >
        Question&#160;
      </Typography>
      <Typography
        gutterBottom
        display="inline"
        className={classes.questionNoNumber1}
      >
        {questionNo}
      </Typography>
      <Typography
        gutterBottom
        display="inline"
        className={classes.questionNoEnd}
      >
        &#160;/&#160;6
      </Typography>
      <Typography gutterBottom className={classes.question}>
        {questionText}
      </Typography>
    </>
  );
};

const feedbackBlueButtonStyles = makeStyles({
  button: {
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 15,
    paddingBottom: 15,
    borderRadius: 27,
    backgroundColor: "#516bf6",
    fontSize: 13,
    color: "white",
    fontWeight: 600,
  },
});

export const FeedbackBlueButton = (props) => {
  const classes = feedbackBlueButtonStyles();
  const { children, ...otherProps } = props;

  return (
    <Button
      variant="outlined"
      disableElevation
      className={classes.button}
      {...otherProps}
    >
      {children}
    </Button>
  );
};

const feedbackOutlinedButtonStyles = makeStyles({
  button: {
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 15,
    paddingBottom: 15,
    borderRadius: 27,
    backgroundColor: "white",
    border: "1px solid #5e6676",
    fontSize: 13,
    color: "#5e6676",
    fontWeight: 600,
  },
});

export const FeedbackOutlinedButton = (props) => {
  const classes = feedbackOutlinedButtonStyles();
  const { children, ...otherProps } = props;

  return (
    <Button
      variant="outlined"
      disableElevation
      className={classes.button}
      {...otherProps}
    >
      {children}
    </Button>
  );
};

const dialogCustomTextFieldStyles = makeStyles((theme) => ({
  input: {
    "&::placeholder": {
      fontStyle: "italic",
    },
  },
}));

export const DialogCustomTextField = ({ onChange, text }) => {
  const classes = dialogCustomTextFieldStyles();

  const handleTextInput = (e) => {
    onChange(e.target.value);
  };

  return (
    <TextField
      id="outlined-adornment-amount"
      onChange={handleTextInput}
      fullWidth
      variant="outlined"
      multiline
      value={text}
      rows={7}
      placeholder="Your answer..."
      autoFocus
      InputProps={{
        classes: { input: classes.input },
      }}
    />
  );
};

const Alert = (props) => {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
};

export const CustomSnackbar = ({ open, children, severity, onClose }) => {
  const handleSnackbarClose = () => {
    onClose();
  };

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={handleSnackbarClose}>
      <Alert onClose={handleSnackbarClose} severity={severity}>
        {children}
      </Alert>
    </Snackbar>
  );
};
