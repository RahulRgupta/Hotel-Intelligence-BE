const rsdata = require("../../models/rsSignUp");
const { signJwt } = require("../../helper/helper");
const propertySchemaModel = require("../../models/property")
const JWT = require("jsonwebtoken")

module.exports = async (req, res) => {
    const email = req.body.email

    const bi = await rsdata.findOne({ email })
    let findProperty = await propertySchemaModel.findOne({ user_id: bi._id }).lean();
   // console.log(findProperty)
    const hotelId = findProperty?.hId
    const _id = bi?._id;
    //console.log(_id)
    const role = bi?.role;
   // console.log(role)
    const name = bi?.name;
    //console.log(name)
    const date = bi?.date;
    //console.log(date)
    let added_by = bi?.added_by;
    //console.log(added_by)
    if (!bi) {
        return res.status(401).json({
            message: "Data not found"
        });
    }

    const jwtToken = await signJwt({ _id, role, name, email, added_by,date})

    return res.status(200).json({
        data  : {
            token : jwtToken.token,
            details : bi,
            hId:hotelId
        },
    });


}