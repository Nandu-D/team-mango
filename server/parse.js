const mongoose = require("mongoose");
require("dotenv").config();

fs = require("fs").promises;

mongoose.connect(process.env.MONGODB_LOCAL_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const Question = require("./question/question.model");
const fileToParse = "./out.html";
const connection = mongoose.connection;

//Reads the file and calls sendData for each question
let datastring = async function () {
  const data = await fs.readFile(fileToParse, "utf8");
  let datarr = await data.split("<hr>");
  return Promise.all(datarr.map((item) => sendData(item)));
};
//Reads and seperates Title, Difficulty and description and saves it to DB
const sendData = async (element) => {
  const difficultyHard = ["Advanced", "Expert"];

  let titleTemp = await element.match(
    /\*+\r*\n*<div id="title">\r*\n*.+\r*\n*<\/div>\r*\n*\*+/
  );

  let dif = await element.match(
    /@+\r*\n*<div id="dif">\r*\n*.+\r*\n*<\/div>\r*\n*@+/
  );

  if (titleTemp && dif) {
    titleTemp = await titleTemp.toString();
    dif = await dif.toString();
    titleTemp = await titleTemp.replace(/\*+\r*\n*<div id="title">\r*\n*/, "");
    dif = await dif.replace(/@+\r*\n*<div id="dif">\r*\n*/, "");
    let title = await titleTemp.replace(/\r*\n*<\/div>\r*\n*\*+/, "");
    let difNum = await dif.replace(/\r*\n*<\/div>\r*\n*@+/, "");
    difNum = await difNum.trim();
    desc = await element.replace(
      /\*+\r*\n*<div id="title">\r*\n*.+\r*\n*<\/div>\r*\n*\*+/,
      ""
    );
    desc = await desc.replace(
      /@+\r*\n*<div id="dif">\r*\n*.+\r*\n*<\/div>\r*\n*@+/,
      ""
    );
    if (title && desc && difNum) {
      let difficulty = " ";
      if (difNum == "1") {
        difficulty = "Beginner";
      } else if (difNum == "2") {
        difficulty = "Intermediate";
      } else {
        difficulty =
          difficultyHard[Math.floor(Math.random() * difficultyHard.length)];
      }

      let res = new Question({
        title: title,
        description: desc,
        difficulty: difficulty,
        random: Math.random(),
      });

      await Promise.all([res.save()]);
      return Promise.resolve("Saved Question");
    }
  }
};

connection.once("open", () => {
  connection.db.listCollections().toArray(async (err, collections) => {
    console.log("Connected to mongoDB");
    await Question.deleteMany({});
    console.log("removed all the questions");

    datastring()
      .then((res) => {
        console.log(
          "Successfully added questions to the database from " + fileToParse
        );
        connection.close();
      })
      .catch((err) => console.log(err));
  });
});

connection.once("disconnected", () => {
  console.log("Disconnected from MongoDB");
});
