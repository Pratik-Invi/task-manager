const express=require('express');
const cors=require('cors');
const bodyParser=require('express').json;
const {pool,init}=require('./db');

const app=express();
app.use(cors());
app.use(bodyParser());

async function start(){
  await init();
  app.get('/api/tasks', async(req,res)=>{
    const {rows}=await pool.query('SELECT * FROM tasks ORDER BY id DESC');
    res.json(rows);
  });
  app.post('/api/tasks', async(req,res)=>{
    const {title}=req.body;
    const {rows}=await pool.query('INSERT INTO tasks(title) VALUES($1) RETURNING *',[title]);
    res.json(rows[0]);
  });
  app.put('/api/tasks/:id', async(req,res)=>{
    const {id}=req.params;
    const {title,done}=req.body;
    const {rows}=await pool.query(
      `UPDATE tasks SET 
         title=COALESCE($1,title), 
         done=COALESCE($2,done),
         completed_at = CASE 
           WHEN $2 IS TRUE THEN NOW()
           WHEN $2 IS FALSE THEN NULL
           ELSE completed_at
         END
       WHERE id=$3 RETURNING *`,
      [title,done,id]);
    res.json(rows[0]);
  });
  app.delete('/api/tasks/:id', async(req,res)=>{
    const {id}=req.params;
    await pool.query('DELETE FROM tasks WHERE id=$1',[id]);
    res.json({success:true});
  });

  // Return all books from the database
  app.get('/api/books', async(req,res)=>{
    const {rows} = await pool.query('SELECT * FROM books ORDER BY id');
    res.json(rows);
  });

  // Update a book's status
  app.put('/api/books/:id', async(req,res)=>{
    const {id} = req.params;
    const {status} = req.body;
    const allowed = ['Interested','Not interested','To Read','Reading','Completed'];
    if(status && !allowed.includes(status)){
      return res.status(400).json({error:'Invalid status'});
    }

    const {rows} = await pool.query(
      'UPDATE books SET status=COALESCE($1,status) WHERE id=$2 RETURNING *',
      [status,id]
    );

    res.json(rows[0]);
  });

  app.listen(5000,()=>console.log("Backend on 5000"));
}
start();
