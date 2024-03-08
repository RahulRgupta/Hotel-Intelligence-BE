const userReq = require("../models/req");
const rsLogin = require("../models/rsSignUp");


module.exports = async (req, res) => {
    let findBiUser = await rsLogin.findOne({ email : req.body.email }).lean();
    //let encryptedPassword = await bcrypt.hash(findBiUser.password, 10);
    const validatePassword = await bcrypt.compare(
        password,
        findBiUser.password
          );

    let newUser = new userReq({
        userId:Randomstring.generate(6),
        email,
        password,
    });

    await newUser.save();

    return res.status(200).json({
        status: true,
        code: 200,
        message: "User registered",
        data: newUser
    });
  }