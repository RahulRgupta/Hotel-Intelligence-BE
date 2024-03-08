const Request = require("../models/req");

module.exports = async (req, res) => {
    try {
        const data = await Request.find({ email: req.query.email }).then((data)=>{
            if(data.length > 0){
                return res.status(200).json({
                    code: 200,
                    status: true,
                    message: "Email Founded successfully",
                });
            }else{
                return res.status(200).json({
                    code: 200,
                    status: false,
                    message: "Email Not Found",
                });
            }
            
        }).catch((err) => {
            return res.status(404).json({
                code: 404,
                status: false,
                message: "Email Not Found",
            });
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};