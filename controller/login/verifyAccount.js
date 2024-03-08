const login = require('../../models/login');
const request = require('../../models/req');
const cmData = require('../../models/cmdata')

module.exports = async (req, res) => {
    try {
        const userId = req.body.userId;
        const hotelCode = req.body.hotelCode;
       // const is_password_active = req.body.is_password_active;
          // Check if user is already verified in the login model
          const isUserVerified = await login.exists({ userId, is_correct: true });

          if (isUserVerified) {
              return res.status(200).json({ message: "User is already verified" });
          }

        const isCorrect = req.body.is_correct && req.body.is_correct.toLowerCase() === 'true'; // Check if is_correct is 'true' as a string

        // Find record by userId in request model
        const foundRequest = await request.findOne({userId: userId });

        if (!foundRequest) {
            return res.status(404).json({ error: "User not found" });
        }

        

        // Update is_correct field if is_correct is true in req.body
        if (isCorrect) {
            foundRequest.is_correct = true; // Set to boolean true
            await foundRequest.save();

           // Push data to login model
           const loginData = new login(foundRequest.toObject());
           await loginData.save();

                // Push data to cmdata model
                            // Push data to cmdata model and include hotelCode
            const savecmData = new cmData({
                ...foundRequest.toObject(),
                hotelCode: hotelCode,
            });

                await savecmData.save();

           return res.status(200).json({ message: "Record updated and pushed to login model successfully" });
        } 
        
        // If is_correct is false or not provided as 'true'
        if (!isCorrect || req.body.is_correct.toLowerCase() === 'false') {
            // Update foundRequest if is_correct is explicitly 'false'

            foundRequest.is_correct = false; // Set to boolean false
            foundRequest.is_credentialsChange = false;
            await foundRequest.save();

            return res.status(200).json({ message: "Record found and updated  is_correct is false" });
        }

            res.status(400).json({ error: "Invalid value for is_correct" });
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal Server Error" });
    }
};
