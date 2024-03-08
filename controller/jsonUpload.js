const hotelModel = require ("../models/hotelModel");
module.exports = async (req, res) => {

    try {
        // Check if a file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Convert buffer to string
        const fileContent = req.file.buffer.toString('utf-8');
        const data = JSON.parse(fileContent);

        // console.log(data)
        await hotelModel.create(data)
        // console.log('data successfully imported')
        return res.status(200).json({ message: "Data successfully uploaded" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }

}