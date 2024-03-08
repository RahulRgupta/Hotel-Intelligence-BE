const dotenv = require("dotenv");
const axios = require("axios");


module.exports = async (req, res) => {
  try {

    const {  hotelCode } = req.body
    if(  !hotelCode){
      return res.status(404).json({
        status: false,
        code: 404,
        message: " hotelCode are required",
    });
    }

    const reqBody = {

      "hotelCode": hotelCode        
    }

    const result = await axios.post(`${process.env.APIUrl}/bookingDetails`, reqBody);
     const finalresult =result.data;
    if(!finalresult){
        return res.status(404).json({
            status: false,
            code: 404,
            message: "error in sending",
            
          });
    }
    return res.status(200).json({
      status: true,
      code: 200,
      message: "success",
      data: finalresult
    });
  
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
