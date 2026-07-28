import express from "express"

const app =express();

app.use(express.json());

app.get('/home',(req,res)=>{
    res.send("you are at home");
})

export default app