const { connectToDatabase, getDatabase } = require('../config/database');

function createMongoStore({ tableName = process.env.TABLE_NAME } = {}) {
  const teams = () => getDatabase().collection(tableName);

  return {
    name: 'mongo',

    async init() {
      await connectToDatabase();
    },

    async findTeamByGithubUsername(username) {
      return teams().findOne({ github_username: username });
    },

    async incrementSolved(username, difficulty) {
      const result = await teams().updateOne(
        { github_username: username },
        { $inc: { [`problems_solved.${difficulty}`]: 1 } }
      );
      console.log(`Update result: ${result.modifiedCount} document(s) updated.`);
      return result.modifiedCount > 0;
    },

    // Unique _id insert doubles as an atomic "first time seen" check across restarts.
    async markPrProcessed(prId) {
      try {
        await getDatabase().collection('processed_prs').insertOne({ _id: prId, at: new Date() });
        return true;
      } catch (error) {
        if (error.code === 11000) return false;
        throw error;
      }
    },

    async listTeams() {
      return teams()
        .find({})
        .project({ team_name: 1, team_members: 1, problems_solved: 1, github_username: 1, penalty: 1, disqualified: 1 })
        .toArray();
    },

    // MongoDB change stream; reconnects on error.
    onChange(listener) {
      const watch = () => {
        const changeStream = teams().watch();
        console.log('Change stream setup complete.');
        changeStream.on('change', listener);
        changeStream.on('error', (error) => {
          console.error('Change stream error:', error);
          setTimeout(() => {
            console.log('Reconnecting to the change stream...');
            watch();
          }, 5000);
        });
      };
      watch();
    },
  };
}

module.exports = { createMongoStore };
