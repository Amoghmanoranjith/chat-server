import jwt from "jsonwebtoken"

const generate = async (payload) =>{
    const key = process.env.JWT_SECRET
    const token = await jwt.sign(payload, key)
    return token
}

export default generate