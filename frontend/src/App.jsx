import React,{useState,useEffect} from 'react';
import AddTask from './components/AddTask';
import TaskList from './components/TaskList';

export default function App(){
  const [tasks,setTasks]=useState([]);

  async function fetchTasks(){
    const r = await fetch('/api/tasks');
    const data = await r.json();
    setTasks(data);
  }

  useEffect(()=>{ fetchTasks(); },[]);

  async function addTask(title){
    const r = await fetch('/api/tasks', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({title})
    });

    const newTask = await r.json();           // FIXED
    setTasks(t => [newTask, ...t]);           // FIXED
  }

  async function toggleTask(id,done){
    const r = await fetch(`/api/tasks/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({done})
    });

    const updated = await r.json();
    setTasks(t => t.map(x => x.id === updated.id ? updated : x));
  }

  async function deleteTask(id){
    await fetch(`/api/tasks/${id}`,{method:'DELETE'});
    setTasks(t => t.filter(x => x.id !== id));
  }

  return(
    <div>
      <h1>Task Manager</h1>
      <AddTask onAdd={addTask}/>
      <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask}/>
    </div>
  );
}
