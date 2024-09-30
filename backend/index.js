const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
//const Permissions = require("./models/Permissions");
var serviceAccount = require("./r-and-d-induction-firebase-adminsdk-pf2gf-d8e0622e57.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

//Middleware makes sure that anyone accessing endpoints is logged in TODO: role-based
app.use(async (req, res, next) => {
    const { authtoken } = req.headers;
  
    if (authtoken) {
      try {
        req.user = await admin.auth().verifyIdToken(authtoken);
      } catch (e) {
        return res.sendStatus(400);
      }
    } else {
      return res.sendStatus(401);
    }
  
    req.user = req.user || {};
    next();
  });

app.get("/api/users", async (req, res) => {
    try {
      const users = [];
      const listUsersResult = await admin.auth().listUsers();
      listUsersResult.users.forEach((userRecord) => {
        users.push({
          uid: userRecord.uid,
          email: userRecord.email,
        });
      });
      
      res.json(users);     
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send(error);
    }
});

app.get("/api/get-user", async (req, res) => {
    try {
        const uid = req.query.uid;
        const userResult = await admin.auth().getUser(uid);
        res.json(userResult);     
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send(error);
    }
});

app.post("/api/users/create-new-user", async(req,res)=>{
    try{
        const { firstName, lastName, email, permission } = req.body;

        if (!email || !permission) {
            return res.status(400).send("Email and permission are required");
          }

        const userRecord = await admin.auth().createUser({
            email: email,
            displayName: `${firstName} ${lastName}`,
            emailVerified: false,
            disabled: false,
        });

        admin.auth().setCustomUserClaims(userRecord.uid, {role: permission});
        
        res.status(201).json({
            uid: userRecord.uid,
            email: userRecord.email,
            role: permission,
            message: "User created and role set successfully"
          });
    } catch (error){
        console.error("Error creating user", error);
        res.status(500).send(error);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});