const userReq = require("../models/req");
const admin = require("../models/login");
const randomString = require('randomstring')
const {userRequest} = require('../helper/helper')
require('dotenv').config();
const rslogin = require("../models/rsSignUp")


module.exports = async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;
    let channel_manager = req.body.channel_manager;
    let cmid = req.body.cmid;
    let cmcred = req.body.cmcred;
    

    if (!email || !password) {
      return res.status(422).json({
        code: 422,
        status: false,
        message: "Please provide all the required field",
      });
    }

    let findEmail = await userReq.findOne({ email }).lean();

    
    let findEmailInLogin = await admin.findOne({ email }).lean();

    if (findEmail || findEmailInLogin) {
      return res.status(409).json({
        code: 409,
        status: false,
        message: "Already exists",
      });
    }
    
    let findRsUser= await rslogin.findOne({ email}).lean();
    if(findRsUser){
      return res.status(200).json({message:"You already have an account in Rs",userDetails:findRsUser,statuscode:200}) 
    }else {
      let newRequest = await userReq.create({
        userId:randomString.generate(6),
        email,
        password,
        channel_manager,
        cmcred,
        cmid,
      });
      await userRequest(email);

      return res.status(200).json({
        code: 200,
        status: true,
        message: "Request Added",
        data: newRequest,
      });
    }
  } catch (error) {
      console.log(error)
    return res.status(500).json({ error: "Internal Server Error" });
  }

};
