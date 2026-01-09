const { getDatabase } = require('../config/database');
const { getDifficultyAndPoints } = require('../utils/helpers');

const TABLE_NAME = process.env.TABLE_NAME;


async function getTeamByGithubUsername(username) {
  const db = getDatabase();
  return db.collection(TABLE_NAME).findOne({ "github_username": username });
}

async function updateTeamPoints(username, difficulty, points) {
  const db = getDatabase();
  try {
    const result = await db.collection(TABLE_NAME).updateOne(
      { "github_username": username },
      {
        $inc: {
          [`problems_solved.${difficulty}`]: 1,
        }
      }
    );
    console.log(`Update result: ${result.modifiedCount} document(s) updated.`);
  } catch (error) {
    console.error('Error updating team points:', error);
  }
}

async function getLeaderboard() {
  const db = getDatabase();
  try {
    const teams = await db.collection(TABLE_NAME).find({ disqualified: false })
      .project({
        team_name: 1,
        team_members: 1, // Include team members
        problems_solved: 1, // Fetch all problem difficulties
        github_username: 1,
        penalty: 1
      })
      .toArray();

    // Dynamically calculate score
    //console.log(teams);
    const leaderboard = teams.map(team => {
      const { easy = 0, medium = 0, hard = 0 } = team.problems_solved || {};

      // Define points for each difficulty level directly
      const difficultyPoints = getDifficultyAndPoints();

      // Calculate score based on the number of solved problems for each difficulty
      let score = 0 - team.penalty;
      score += easy * difficultyPoints.easy;
      score += medium * difficultyPoints.medium;
      score += hard * difficultyPoints.hard;

      return {
        team_name: team.team_name,
        team_members: team.team_members,
        score: score || 0, // Calculated score
        problems_solved: team.problems_solved, // Include problem counts if necessary
        github_username: team.github_username
      };
    });

    //console.log(leaderboard);
    return leaderboard;
  } catch (error) {
    throw error;
  }
}


module.exports = { getTeamByGithubUsername, updateTeamPoints, getLeaderboard };
