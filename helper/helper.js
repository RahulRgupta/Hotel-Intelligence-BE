require("dotenv").config();
const jwt = require("jsonwebtoken");
const user = require("../models/login");
const sgMail = require("@sendgrid/mail");
const ejs = require('ejs'); // Import the ejs package
const path = require('path')
const axios = require('axios')
const qs = require('qs')
const s3 = require('../utils/url')

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//
async function signJwt(payloadData) {
  const jwtPayload = payloadData;

  const addToken = { ...payloadData };

  // JWT token with Payload and secret.
  addToken.token = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TIMEOUT_DURATION,
  });

  return addToken;

}

//generate Token
function jwtsign(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.jwtsecretkey, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
}

//middleware verification token
const jwtTokenVerify = async (req, res, next) => {
    const token =  req.headers["authcode"];
    if (!token) {
      return res.status(404).json({message:"A token is required for authentication"});
    }
    try {
      const decoded = jwt.verify(token, process.env.jwtsecretkey);
      // console.log(decoded)
      req.email = decoded.email; 
    } catch (err) {
      return res.status(404).send({message:"Invalid Token"});
    }
    return next();
  };

  

  //SignUp mail
  const userRequest = async (email) => {
    const emailTemplatePath = path.join( 'controller', 'Mails', 'crudential-mail.ejs');
    const emailHTML = await ejs.renderFile(emailTemplatePath);
    const msg = {
        to: email,
        from: 'retvenssoftwares@gmail.com', // Replace with your verified sender email
        subject: 'Hotel Intelligence',
        html: emailHTML,
        text: `Thank you for Registering with Hotel Intelligence.If you have any question, please don't hesitate to contact us at retvenssoftwares@gmail.com`,
    };
  
    try {
        await sgMail.send(msg);
        console.log('OTP Verification Email sent successfully');
    } catch (error) {
        console.error('Error sending OTP Verification Email:', error.response.body);
    }
  };

  //Otp verification
  const otpVerification = async (email, otp) => {
    const msg = {
        to: email,
        from: 'retvenssoftwares@gmail.com', // Replace with your verified sender email
        subject: 'OTP Verification',
        text: `Your OTP for verification is: ${otp}`,
        html: `<p>Your OTP for verification is: <strong>${otp}</strong></p>`,
    };

    try {
        await sgMail.send(msg);
        console.log('OTP Verification Email sent successfully');
    } catch (error) {
        console.error('Error sending OTP Verification Email:', error.response.body);
    }

  
};
  //date formatter
  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
  }

  // Function to send WhatsApp message
 const sendWhatsAppMessage = async (message) => {
  try {
    const data = qs.stringify({
      "token": "whs896dr2a2ztzta",
      "to": "917263968229", // Replace with the recipient's phone number
      "body": message
    });

    const config = {
      method: 'post',
      url: 'https://api.ultramsg.com/instance54915/messages/chat',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    const response = await axios(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
};


//function to upload single image ot s3 spaces
const bucket = process.env.bucket;
async function uploadImageToS3(file) {
  const params = {
    Bucket: bucket, // Replace with your S3 bucket name
    Key: `hotel_images/${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  const uploadPromise = s3.upload(params).promise();
  const uploadResponse = await uploadPromise;
  const imageUrl = uploadResponse.Location;

  return imageUrl;
}

  //
module.exports = {signJwt, jwtsign, jwtTokenVerify,userRequest,otpVerification ,formatDate,sendWhatsAppMessage,uploadImageToS3 };
