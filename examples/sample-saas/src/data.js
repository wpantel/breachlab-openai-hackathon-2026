const users = {
  "user-red": { id: "user-red", name: "Riley Reader", teamId: "team-red", role: "member" },
  "user-blue": { id: "user-blue", name: "Blair Builder", teamId: "team-blue", role: "member" },
  "admin-red": { id: "admin-red", name: "Avery Admin", teamId: "team-red", role: "admin" },
};

const documents = {
  "doc-red-roadmap": {
    id: "doc-red-roadmap",
    teamId: "team-red",
    title: "Red Team Roadmap",
    body: "Q2 launch plan for the red workspace.",
  },
  "doc-blue-budget": {
    id: "doc-blue-budget",
    teamId: "team-blue",
    title: "Blue Team Budget",
    body: "Private budget notes for the blue workspace.",
  },
};

module.exports = { users, documents };
