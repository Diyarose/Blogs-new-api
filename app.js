const express=require("express")
const mongoose=require("mongoose")
const cors=require("cors")
const {registermodel}=require("./models/register")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const postModel = require("./models/post")

const generateHashedPassword=async(password)=>{
    const salt=await bcrypt.genSalt(10)
    return bcrypt.hash(password,salt)
}

const app=express()
app.use(cors())
app.use(express.json())
mongoose.connect("mongodb+srv://dhiya04:dhiyafisat@cluster0.wspdqan.mongodb.net/blogsdb?retryWrites=true&w=majority&appName=Cluster0")
app.post("/signup",async(req,res)=>{
   let input=req.body
   let hashedPassword=await generateHashedPassword(input.pass)
   console.log(hashedPassword)
   input.pass=hashedPassword
   let register=new registermodel(input)
   register.save()
   console.log(register)
   res.json({"status":"success"})
})

app.post("/login",(req,res)=>{
    let input=req.body
    registermodel.find({"email":req.body.email}).then(
        (response)=>{
            if(response.length>0){
                let dbPassword=response[0].pass
                console.log(dbPassword)
                bcrypt.compare(input.pass,dbPassword,(error,isMatch)=>{
                    if(isMatch){
                        jwt.sign({email:input.email},"blog-app",{expiresIn:"1d"},(error,token)=>{
                            if(error)
                                {
                                    res.json({"status":"unable to create token"})
                                }
                                else{
                                    res.json({"status":"success","userid":response[0]._id,"token":token})
                                }
                            }
                        )
                    }else{
                        res.json({"status":"incorrect"})
                    }
                        })
                    }
                    else{
                        res.json({"status":"user not found"})
                    }
                    }
            ).catch()
            
})

app.post("/add",async(req,res)=>{
    let input=req.body

    let token=req.headers.token

    jwt.verify(token,"blog-app",async(error,decoded)=>{
        if(decoded && decoded.email){
            let result=new postModel(input)
            await result.save()
            res.json({"status":"success"})
        }
        else
        {
            res.json({"status":"Invalid Authentication"})
        }
    })
})

app.post("/viewall",(req,res)=>{

    let token=req.headers.token
    jwt.verify(token,"blog-app",(error,decoded)=>{
        if(decoded && decoded.email){
            postModel.find().then(
                (items)=>{
                    res.json(items)
                }
            ).catch(
                (error)=>{
                    res.json({"status":"error"})
                }
            )
        }
        else{
            res.json({"status":"Invalid Authentication"})
        }
    })
})

app.post("/viewmypost",(req,res)=>{
    let input=req.body
    let token=req.headers.token
    jwt.verify(token,"blog-app",(error,decoded)=>{
        if(decoded && decoded.email){
            postModel.find(input).then(
                (items)=>{
                    res.json(items)
                }
            ).catch(
                (error)=>{
                    res.json({"status":"error"})
                }
            )
        }
        else{
            res.json({"status":"Invalid Authentication"})
        }
    })
})



app.listen(8080,()=>{
    console.log("Server started")
})
