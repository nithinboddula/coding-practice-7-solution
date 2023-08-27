const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertingToCamelCase = (snake_case_array) => {
  const camelCaseArray = snake_case_array.map((eachObj) => {
    const camelCaseObj = {
      playerId: eachObj.player_id,
      playerName: eachObj.player_name,
    };
    return camelCaseObj;
  });

  return camelCaseArray;
};

const convertingMatchDetailsToCamelCase = (snake_case_array) => {
  const camelCaseArray = snake_case_array.map((eachObj) => {
    const camelCaseObj = {
      matchId: eachObj.match_id,
      match: eachObj.match,
      year: eachObj.year,
    };
    return camelCaseObj;
  });

  return camelCaseArray;
};

// GET all players in camelCase API 1

app.get("/players/", async (request, response) => {
  const getAllPlayersArrayQuery = `SELECT *
    FROM 
        player_details; `;

  const playersArraySnakeCase = await db.all(getAllPlayersArrayQuery);
  const camelCaseResultArray = convertingToCamelCase(playersArraySnakeCase);
  response.send(camelCaseResultArray);
});

// GET player details based on player_id API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getMovieDetailsQuery = `
    SELECT  *
    FROM
        player_details
  WHERE
      player_id = ${playerId} ;`;
  const playerObj = await db.get(getMovieDetailsQuery);
  const resultObj = {
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  };
  response.send(resultObj);
});

//PUT player details API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `
    UPDATE
       player_details
    SET
      player_name = '${playerName}'
    WHERE
         player_id = ${playerId} ;
    `;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

// GET match details based on match_id API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT  *
    FROM
        match_details
  WHERE
      match_id = ${matchId} ;`;
  const matchObj = await db.get(getMatchDetailsQuery);
  const resultObj = {
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  };
  response.send(resultObj);
});

//GET a list of all the matches of a player API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesArrayQuery = `SELECT *
    FROM 
        match_details NATURAL JOIN player_match_score
    WHERE
       player_Id = ${playerId} ; `;

  const moviesArraySnakeCase = await db.all(getMatchesArrayQuery);
  const camelCaseResultArray = convertingMatchDetailsToCamelCase(
    moviesArraySnakeCase
  );
  response.send(camelCaseResultArray);
});

//GET a list of players of a specific match API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayersArrayQuery = `SELECT *
    FROM 
        player_details NATURAL JOIN player_match_score
    WHERE
       match_Id = ${matchId} ; `;

  const playersArraySnakeCase = await db.all(getAllPlayersArrayQuery);
  const camelCaseResultArray = convertingToCamelCase(playersArraySnakeCase);
  response.send(camelCaseResultArray);
});

// GET the statistics of the total score, fours, sixes of a specific player based on the player ID API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `SELECT player_id, player_name, SUM(score), SUM(fours), SUM(sixes)
    FROM 
        player_details NATURAL JOIN player_match_score
    WHERE
       player_Id = ${playerId} ; `;
  const playerObj = await db.get(getPlayerDetailsQuery);
  const resultObj = {
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
    totalScore: playerObj["SUM(score)"],
    totalFours: playerObj["SUM(fours)"],
    totalSixes: playerObj["SUM(sixes)"],
  };
  response.send(resultObj);
});

module.exports = app;
